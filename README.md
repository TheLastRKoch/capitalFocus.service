# Capital Focus Service

Capital Focus is a financial management platform designed to provide comprehensive visibility into budgets and transactions.

## Features

- **Budget Management**: Monitor and organize active and inactive budgets efficiently.
- **Transaction Tracking**: Track financial activity and identify uncategorized transactions.
- **Teable Integration**: Use Teable as a scalable backend for flexible data management.
- **Modern User Interface**: A responsive experience built with Bootstrap 5 that emphasizes clean aesthetics and high usability.

## Architecture

This application uses a dynamic Client-Side Rendering approach. The frontend consists of Vanilla JavaScript and HTML templates that interact with a robust backend API.

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
    Copy the `env.example` file to `.env` and provide your Teable credentials.
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

Execute the following command to run the application:

```bash
python src/app.py
```

The application will be available at the host and port specified in the environment configuration.

### User Interface Design Standards

The user interface follows Jakob Nielsen's 10 Usability Heuristics to ensure a seamless experience:
- **Visibility of System Status**: Budget overviews provide immediate context.
- **Consistency and Standards**: A unified design language is applied across all modules.
- **User Control and Freedom**: Navigation is intuitive via a persistent sidebar.
- **Aesthetic and Minimalist Design**: The layout focuses on essential data to reduce cognitive load.

## License

This project is licensed under the MIT License. Please refer to the [LICENSE](LICENSE) file for more information.
