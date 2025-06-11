"""
Automation Script: Generate CHANGELOG.md from implementation report using OpenAI

- Reads a markdown implementation report from the docs folder
- Sends it to OpenAI with a custom changelog prompt
- Outputs a formatted CHANGELOG.md to the root directory

Author: Nico D'Alessandro Calderon 
Email:  nico.dalessandro@gmail.com
Date: 2025-04-12
Version: 1.0.0
License: MIT
"""

import os
from pathlib import Path
from openai import OpenAI
from shared.common_lib.emoji_logger import info, success, error

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Configuration Block
BASE_DIR = Path(__file__).resolve().parents[2]
REPORT_PATH = "shared/scripts/data/git_history.md"
OUTPUT_PATH = BASE_DIR / "CHANGELOG.md"
MODEL_NAME = "gpt-4"

# Main Script Function
def run(report_path: Path = REPORT_PATH, output_path: Path = OUTPUT_PATH, model: str = MODEL_NAME) -> None:
    """
    Generate CHANGELOG.md from implementation report using OpenAI.
    Args:   
        report_path (Path): Path to the implementation report.
        output_path (Path): Path to save the generated CHANGELOG.md.
        model (str): OpenAI model to use for generation.
    """
    try:
        info(f"Reading implementation report from {report_path}")
        with report_path.open("r", encoding="utf-8") as f:
            input_text = f.read()
    except FileNotFoundError:
        error(f"File not found: {report_path}")
        return

    prompt_header = (
        "# \*Are U Query-ous?\* - Changelog\n\n"
        "This project follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and uses "
        "[Semantic Versioning](https://semver.org/).\n\n"
        "---\n\n"
        "Use meaningful groupings like Features, Database, Docs, Refactor, etc.\n"
    )

    prompt = (
        "You're a technical release manager. Based on the following git history, generate "
        "a clean and professional CHANGELOG.md file.\n\n"
        f"Make sure to include this header at the top:\n\n{prompt_header}\n"
        "Now generate the changelog from the following git history:\n\n"
        f"{input_text}"
    )

    try:
        info("Calling OpenAI Chat API to generate changelog...")
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that formats project changelogs."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
        )
        output = response.choices[0].message.content
    except Exception as e:
        error(f"OpenAI API call failed: {e}")
        return

    try:
        with output_path.open("w", encoding="utf-8") as f:
            f.write(output)
        success(f"CHANGELOG.md updated successfully at {output_path}")
    except Exception as e:
        error(f"Failed to write output file: {e}")


# CLI Fallback
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate CHANGELOG.md from implementation report using OpenAI.")
    parser.add_argument("--report_path", type=str, default=str(REPORT_PATH),
                        help="Path to implementation_report.md")
    parser.add_argument("--output_path", type=str,
                        default=str(OUTPUT_PATH), help="Output path for CHANGELOG.md")
    parser.add_argument("--model", type=str,
                        default=MODEL_NAME, help="OpenAI model to use")

    args = parser.parse_args()
    run(report_path=Path(args.report_path), output_path=Path(
        args.output_path), model=args.model)
