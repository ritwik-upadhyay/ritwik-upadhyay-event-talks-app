# BigQuery Release Notes Hub 🚀

A modern, responsive web application built using **Python Flask** and plain **HTML, JavaScript, and CSS** that fetches, structures, and displays the latest Google Cloud BigQuery Release Notes, with built-in Twitter/X sharing integration.

---

## 🌟 Key Features

*   **Live RSS/Atom Parsing**: Fetches the official Google Cloud BigQuery Release Notes feed directly.
*   **Granular Parsing**: Deconstructs entries into individual updates (e.g., Features, Issues, Changes, Deprecations) instead of presenting them in large, daily blocks.
*   **Server-Side Caching**: Uses a 10-minute cache mechanism in the Flask backend to assure rapid page loading and prevent Google Cloud feed server rate-limiting.
*   **Interactive Search & Filter**: Enables real-time, client-side filtering by category badges (Feature, Issue, Changed, Deprecated, General) and text searches.
*   **Aesthetic Dark UI**: Features responsive, glassmorphic grids, neon glow badges, and smooth animations.
*   **Smart Tweet Composer**:
    *   Drafts tweets using pre-configured templates (*Standard*, *Excited 🚀*, *Analyst 📊*, and *Short ⚡*).
    *   **Auto-Truncation**: Automatically calculates character budgets (taking links, hashtags, and template structures into account) and truncates descriptions to keep drafts under Twitter's 280-character limit.
    *   **Visual Counter**: Employs an SVG circular progress ring that shifts color dynamically as you approach or exceed the character limit.

---

## 🛠️ Technology Stack

*   **Backend**: Python, Flask, BeautifulSoup4, urllib
*   **Frontend**: Plain HTML5, CSS3 (Vanilla custom styling), JavaScript (ES6+ Vanilla)
*   **Icons**: FontAwesome 6
*   **Typography**: Google Fonts ('Outfit' and 'Plus Jakarta Sans')

---

## 📂 Project Structure

```text
├── app.py                  # Flask Web Server, Feed Fetcher, Parser & In-Memory Cache
├── templates/
│   └── index.html          # Main HTML5 UI Structure
├── static/
│   ├── css/
│   │   └── styles.css      # Dark Mode Dashboard Styling & Progress Ring Animations
│   └── js/
│       └── app.js          # Client-side State, Search/Filter, and Tweet Composer Logic
├── .gitignore              # Files ignored in Git tracking
└── README.md               # Project Documentation
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have **Python 3** installed on your system.

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone git@github.com:ritwik-upadhyay/ritwik-upadhyay-event-talks-app.git
   cd ritwik-upadhyay-event-talks-app
   ```

2. **Initialize and Activate a Virtual Environment**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install flask beautifulsoup4 requests
   ```

4. **Run the Server**:
   ```bash
   python3 app.py
   ```

5. **Access the Web App**:
   Open your browser and navigate to:
   👉 **[http://127.0.0.1:5001](http://127.0.0.1:5001)**

---

## 📝 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE details.
