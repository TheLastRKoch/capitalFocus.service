# Capital Focus Service

Capital Focus is a financial management application designed to provide clear visibility into budgets and transactions.

## Features

- **Budget Management:** Overview of active and inactive budgets.
- **Transaction Tracking:** (In progress)
- **Teable Integration:** Uses Teable as a backend database for flexible data management.
- **Modern UI:** Built with Bootstrap 5, featuring a clean green theme and adhering to Jakob Nielsen's 10 Usability Heuristics.

## Project Structure

```
.
├── src/
│   ├── app.py              # Application entry point
│   ├── services/
│   │   └── teable.py       # Teable API service implementation
│   ├── templates/          # HTML templates (Budgets, Budget Description, etc.)
│   ├── static/             # Static assets (CSS, JS, Images)
│   └── environment.py      # Environment variable configuration
├── env.example             # Template for environment variables
└── README.md               # Project documentation
```

## Setup and Installation

### Prerequisites

- Python 3.8+
- [Teable](https://teable.io/) account and API key.

### Configuration

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd capitalFocus.service
    ```

2.  **Set up environment variables:**
    Copy the `env.example` file to `.env` and fill in your Teable credentials.
    ```bash
    cp env.example .env
    ```
    Edit `.env`:
    ```
    TEABLE_BASE_URL=https://app.teable.ai/api
    TEABLE_API_KEY=your_api_key_here
    ```

3.  **Install dependencies:**
    ```bash
    pip install requests python-dotenv
    ```

## Development

The UI is currently located in `src/templates/` and can be viewed by opening the HTML files in a browser. The backend service is located in `src/services/teable.py`.

### UI Heuristics Applied

The recent UI refactor focused on Jakob Nielsen's 10 Heuristics, including:
- **Visibility of system status:** Summary cards for budget overview.
- **Consistency and standards:** Unified header and navigation across pages.
- **User control and freedom:** Easy navigation via a side menu.
- **Aesthetic and minimalist design:** Clean layout with a focus on essential information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
