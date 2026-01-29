# Job Match AI | Intelligent Career Matching

Job Match AI is a modern SaaS recruitment platform that uses Knowledge Graphs and AI to bridge the gap between candidates and employers. It analyzes CVs, detects skill gaps, visualizes professional networks, and provides intelligent career insights.

## 🚀 Key Features

- **CV Analysis**: High-fidelity text extraction from PDFs using PyMuPDF, pdfplumber, and OCR (Tesseract).
- **Intelligent Matching**: Uses TF-IDF and Knowledge Graph relationship scores to match CVs with the most relevant job postings.
- **Knowledge Graph Visualization**: Interactive visualization of users, jobs, skills, and their relationships using D3.js and NetworkX.
- **Skill Gap Detection**: Identifies missing skills required for target roles and provides recommendations.
- **AI Mock Interview**: Practice interview questions with an AI-simulated recruiter.
- **Salary Estimation**: Data-driven salary predictions based on job titles and experience levels.
- **Modern Dashboard**: Comprehensive UI for tracking applications and skill progress.

## 🛠️ Tech Stack

- **Backend**: Python, Flask, NetworkX, RDFLib, Scikit-learn, Pandas, NumPy.
- **Frontend**: HTML5, Vanilla CSS (Modern design), JavaScript (D3.js for graphs).
- **Data Preservation**: Openpyxl for Excel database interaction.
- **CV Processing**: PyMuPDF, pdfplumber, Pytesseract for OCR.

## 📁 Project Structure

- `app.py`: Main Flask application and API endpoints.
- `config.py`: Centralized configuration for matching weights, skill lexicons, and OCR settings.
- `graph_builder.py`: Logic for building the Knowledge Graph from data.
- `matching.py`: Core algorithms for user-job scoring and similarity.
- `skill_extraction.py`: NLP-based skill detection from text.
- `static/`: Frontend assets (CSS, JS, Images).
- `templates/`: HTML pages, organized by feature components.
- `db_job_tuan.xlsx`: Default job database.

## ⚙️ Installation & Setup

### 1. Prerequisites
- Python 3.8+
- Tesseract OCR (Optional, for image-based CVs)

### 2. Setup Environment
```bash
# Create virtual environment
python -m venv .venv

# Activate environment (Windows)
.venv\Scripts\activate

# Activate environment (Linux/macOS)
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Running the Application
```bash
python app.py
```
The application will be available at `http://localhost:5000`.

## ⚙️ Configuration
You can customize the matching logic, skill lexicons, and visualization settings in `config.py`. Key parameters include:
- `TOPK_USER_JOB`: Number of top matches to display.
- `SIM_THRESHOLD`: Minimum similarity score for matches.
- `SKILL_LEXICON`: Dictionary for skill normalization.

---
*Developed as part of the NCKH Job Matching System research.*
