"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Command as CommandPrimitive } from "cmdk"

type Option = {
    label: string
    value: string
    description?: string
    unit?: string
}

interface MultiSelectProps {
    options: Option[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
    className?: string
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select options...",
    className,
}: MultiSelectProps) {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")
    const [menuPosition, setMenuPosition] = React.useState<'top' | 'bottom'>('bottom')

    const handleUnselect = (option: string) => {
        onChange(selected.filter((s) => s !== option))
    }

    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            const input = inputRef.current
            if (input) {
                if (e.key === "Delete" || e.key === "Backspace") {
                    if (input.value === "" && selected.length > 0) {
                        onChange(selected.slice(0, -1))
                    }
                }
                if (e.key === "Escape") {
                    input.blur()
                }
            }
        },
        [selected, onChange]
    )

    const updateMenuPosition = React.useCallback(() => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect()
            const spaceBelow = window.innerHeight - rect.bottom
            const spaceAbove = rect.top
            setMenuPosition(spaceBelow < 200 && spaceAbove > spaceBelow ? 'top' : 'bottom')
        }
    }, [])

    React.useEffect(() => {
        if (open) {
            updateMenuPosition()
            window.addEventListener('scroll', updateMenuPosition)
            window.addEventListener('resize', updateMenuPosition)
            return () => {
                window.removeEventListener('scroll', updateMenuPosition)
                window.removeEventListener('resize', updateMenuPosition)
            }
        }
    }, [open, updateMenuPosition])

    const selectables = options.filter((option) => !selected.includes(option.value))

    return (
        <Command
            onKeyDown={handleKeyDown}
            className={`overflow-visible bg-transparent ${className}`}
        >
            <div className="group rounded-md bg-gray-200/50 px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div className="flex flex-wrap gap-1">
                    {selected.map((selectedValue) => {
                        const option = options.find((o) => o.value === selectedValue)
                        if (!option) return null
                        return (
                            <Badge
                                key={option.value}
                                variant="secondary"
                                className="rounded-sm px-1 font-normal text-xxs bg-white/80 text-black hover:bg-white dark:bg-gray-800 dark:text-white"
                            >
                                {option.label}
                                <button
                                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleUnselect(option.value)
                                        }
                                    }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                    }}
                                    onClick={() => handleUnselect(option.value)}
                                >
                                    <X className="h-3 w-3 text-gray-500 hover:text-gray-700" />
                                </button>
                            </Badge>
                        )
                    })}
                    <CommandPrimitive.Input
                        ref={inputRef}
                        value={inputValue}
                        onValueChange={setInputValue}
                        onBlur={() => setOpen(false)}
                        onFocus={() => setOpen(true)}
                        placeholder={selected.length === 0 ? placeholder : undefined}
                        className="ml-2 flex-1 bg-transparent outline-none placeholder:text-gray-400"
                    />
                </div>
            </div>
            <div className="relative mt-2">
                {open && selectables.length > 0 ? (
                    <div
                        className={`absolute z-50 w-[var(--radix-command-trigger-width)] rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in ${menuPosition === 'top' ? 'bottom-full mb-2' : 'top-0'
                            }`}
                    >
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                            {selectables.map((option) => {
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onMouseDown={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                        }}
                                        onSelect={() => {
                                            setInputValue("")
                                            onChange([...selected, option.value])
                                        }}
                                        className={"cursor-pointer"}
                                    >
                                        <div>
                                            <div className="font-medium">{option.label}</div>
                                            {option.description && (
                                                <div className="text-sm text-muted-foreground">
                                                    {option.description}
                                                </div>
                                            )}
                                        </div>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </div>
                ) : null}
            </div>
        </Command>
    )
} 