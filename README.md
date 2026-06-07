# Capital Focus Service

Capital Focus is a financial management platform that provides visibility into budgets and transactions.

## Features

- **Budget Management**: Organize active and inactive budgets.
- **Transaction Tracking**: Monitor financial activity and identify uncategorized transactions.
- **Django ORM Integration**: Local database management using Django's native ORM.
- **User Interface**: A responsive interface built with Bootstrap 5.

## Architecture

This application uses dynamic client-side rendering. The frontend uses vanilla JavaScript and HTML templates to interact with a backend API.

## Project Structure

```
.
├── budgets/            # Budget app (views, urls)
├── transactions/       # Transactions app (views, urls)
├── core/               # Shared logic (repositories, services)
├── capital_focus/      # Main Django project configuration
├── static_files/       # Static assets including CSS, JavaScript, and images
├── templates/          # HTML templates for the frontend
├── manage.py           # Django management script
├── env.example         # Template for environment variables
└── README.md           # Project documentation
```

## Setup and Installation

### Prerequisites

- Python 3.8 or higher

### Installation

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd capitalFocus.service
    ```

2.  **Configure Environment Variables**
    Copy `env.example` to `.env` and set your secret key.
    ```bash
    cp env.example .env
    ```

3.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

## Development

Run the following command to start the application:

```bash
python manage.py runserver
```

### User Interface Design Standards

The user interface adheres to Jakob Nielsen's ten usability heuristics:
- **Visibility of System Status**: Budget overviews provide context.
- **Consistency and Standards**: A unified design is applied across all modules.
- **User Control and Freedom**: Navigation is intuitive via a persistent sidebar.
- **Aesthetic and Minimalist Design**: The layout focuses on essential data.

## License

This project is licensed under the MIT License. Refer to the [LICENSE](LICENSE) file for more information.
