
"""
Automation Script: Generate Git Commit Message using OpenAI and inject into git_history.md

- Analyzes current git status and file changes
- Sends the diff summary to OpenAI with a custom commit template prompt
- Replaces the first line of git_history.md with the commit message as title

Author: Nico D'Alessandro Calderon
Email:  nico.dalessandro@gmail.com
Date: 2025-05-06
Version: 1.1.0
License: MIT
"""

import os
import subprocess
from datetime import date
from openai import OpenAI
from pathlib import Path
from dotenv import load_dotenv
from shared.common_lib.emoji_logger import info, success, error

# Load env vars
load_dotenv()

# Constants
BASE_DIR = Path(__file__).resolve().parents[2]
HISTORY_FILE = BASE_DIR / "shared/scripts/data/git_history.md"


def get_git_diff_summary():
    """
    Get the summary of staged files for commit using git diff.
    Returns:
        str: Summary of staged files.
    """
    try:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-status"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        error(f"Failed to get git diff: {e.stderr.strip()}")
        return ""


def run(model="gpt-4"):
    """
    Generate a Git commit message from staged changes using OpenAI and inject into git_history.md.
    Args:
        model (str): OpenAI model to use.
    """
    today = date.today().isoformat()
    diff_summary = get_git_diff_summary()

    if not diff_summary:
        error("No staged changes detected. Stage files with `git add` before running this script.")
        return

    # Prompt to OpenAI
    template_description = '''
    You are an expert in writing clean and expressive Git commit messages for professional software teams.

    Use the following template to create a commit message based on the staged file changes.

    Template format:

        <emoji> <TYPE> | <YYYY-MM-DD> | <Short Summary>

        - <Bullet 1: what was done + file/module affected>
        - <Bullet 2: why it was done or what problem it solves>
        - <Bullet 3: technical details or tools involved (optional)>

        <Optional final note explaining purpose, milestone reached, or broader impact>

    Available Types:
    🛠️ Setup, 📦 Feature, 🐛 Fix, 🔐 Config, 🗃️ DB, 📄 Docs, 🧪 Test, ♻️ Refactor, 🚀 Deploy
    '''

    prompt = f"""{template_description}

    Today's date: {today}

    The following files were staged for commit:
    {diff_summary}

    Please generate a well-structured commit message based on this.
    """

    try:
        info("Calling OpenAI to generate commit message...")
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that formats Git commit messages."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
        )
        message = response.choices[0].message.content.strip()
    except Exception as e:
        error(f"OpenAI API call failed: {e}")
        return

    # Inject commit message in title of git_history.md
    try:
        if not HISTORY_FILE.exists():
            error(f"git_history.md not found at: {HISTORY_FILE}")
            return

        with HISTORY_FILE.open("r", encoding="utf-8") as f:
            lines = f.readlines()

        # Reformat the title with the commit message
        lines[0] = f"# *Are U Query-ous?* - GIT LOGS\n\n## {message}\n"

        with HISTORY_FILE.open("w", encoding="utf-8") as f:
            f.writelines(lines)

        success(
            "Commit message generated and injected into git_history.md successfully.")
    except Exception as e:
        error(f"Failed to update git_history.md: {e}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate a Git commit message from staged changes using OpenAI and inject into git_history.md")
    parser.add_argument("--model", type=str, default="gpt-4",
                        help="OpenAI model to use")
    args = parser.parse_args()

    run(model=args.model)
