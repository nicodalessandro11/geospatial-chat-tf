"""
Setup configuration for AUQ NLP package

Professional Python package setup with proper dependencies,
metadata, and installation configuration.
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read the README file
this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text(encoding='utf-8')

# Read requirements
def read_requirements(filename):
    """Read requirements from file"""
    with open(filename, 'r', encoding='utf-8') as f:
        return [line.strip() for line in f if line.strip() and not line.startswith('#')]

setup(
    name="auq_nlp",
    version="2.0.0",
    author="Nicolas Dalessandro", 
    author_email="nicodalessandro11@gmail.com",
    description="Are U Query-ous - Natural Language Processing API for Urban Analytics",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/nicolasdalessandro/auq-nlp",
    
    # Package configuration
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    
    # Include package data
    include_package_data=True,
    package_data={
        "auq_nlp": [
            "config/prompts/*.txt",
            "docs/*.md",
        ],
    },
    
    # Dependencies
    install_requires=read_requirements("requirements.txt"),
    
    # Development dependencies
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "isort>=5.12.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
        ],
        "test": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.0.0",
            "httpx>=0.24.0",
        ],
    },
    
    # Python version requirement
    python_requires=">=3.8",
    
    # Entry points
    entry_points={
        "console_scripts": [
            "auq-nlp=auq_nlp.api.main:main",
        ],
    },
    
    # Classifiers
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Scientific/Engineering :: Information Analysis",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Text Processing :: Linguistic",
    ],
    
    # Keywords
    keywords=[
        "nlp",
        "natural-language-processing",
        "langchain",
        "openai",
        "sql",
        "urban-analytics",
        "geospatial",
        "fastapi",
        "api",
    ],
    
    # Project URLs
    project_urls={
        "Bug Reports": "https://github.com/nicolasdalessandro/auq-nlp/issues",
        "Source": "https://github.com/nicolasdalessandro/auq-nlp",
        "Documentation": "https://github.com/nicolasdalessandro/auq-nlp/blob/main/README.md",
    },
) 