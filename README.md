# Capital Focus Service

Capital Focus is a financial management platform that provides visibility into budgets and transactions.

## Features

- **Budget Management**: Organize active and inactive budgets.
- **Transaction Tracking**: Monitor financial activity and identify uncategorized transactions.
- **Teable Integration**: Use Teable as a backend for data management.
- **User Interface**: A responsive interface built with Bootstrap 5.

## Architecture

This application uses dynamic client-side rendering. The frontend uses vanilla JavaScript and HTML templates to interact with a backend API.

## Project Structure

```
.
├── src/
│   ├── api/                # API endpoint definitions
│   ├── controllers/        # Route handlers for web views
│   ├── repositories/       # Data access layer for Teable records
│   ├── services/           # External service integrations
│   ├── static/             # Static assets including CSS, JavaScript, and images
│   ├── templates/          # HTML templates for the frontend
│   ├── app.py              # Main application entry point
│   └── environment.py      # Environment configuration and variable management
├── env.example             # Template for environment variables
└── README.md               # Project documentation
```

## Setup and Installation

### Prerequisites

- Python 3.8 or higher
- A [Teable](https://teable.io/) account and an API key

### Installation

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd capitalFocus.service
    ```

2.  **Configure Environment Variables**
    Copy `env.example` to `.env` and enter your Teable credentials.
    ```bash
    cp env.example .env
    ```
    Update the `.env` file with the following values:
    ```
    TEABLE_BASE_URL=https://app.teable.ai/api
    TEABLE_API_KEY=your_api_key_here
    ```

3.  **Install Dependencies**
    ```bash
    pip install flask requests python-dotenv
    ```

## Development

Run the following command to start the application:

```bash
python src/app.py
```

The application runs on the host and port defined in the environment configuration.

### User Interface Design Standards

The user interface adheres to Jakob Nielsen's ten usability heuristics:
- **Visibility of System Status**: Budget overviews provide context.
- **Consistency and Standards**: A unified design is applied across all modules.
- **User Control and Freedom**: Navigation is intuitive via a persistent sidebar.
- **Aesthetic and Minimalist Design**: The layout focuses on essential data.

## License

This project is licensed under the MIT License. Refer to the [LICENSE](LICENSE) file for more information.
