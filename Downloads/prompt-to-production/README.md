# NASSCOM AI Assignment - Calculator App

## Project Overview

This project is a GUI-based calculator application built using Python Tkinter following the R.I.C.E prompt engineering framework.

## Features

- Basic arithmetic operations (+, -, \*, /)
- Decimal input support
- Error handling (division by zero, invalid syntax displays "Error")
- Pastel-themed responsive UI design
- Keyboard input support (0-9, +−\*/, Enter, Backspace, Escape)
- Last 5 calculations history panel
- Backspace (DEL) functionality
- Toggle sign (+/-) for positive/negative numbers
- Percentage calculation (%)

## R.I.C.E Framework

### Role

Expert Python Developer specializing in building intuitive desktop applications and writing clean, maintainable code.

### Intent

Design and implement a fully functional GUI calculator application.

### Context

The application should:

- Be built using Python Tkinter (no external libraries)
- Support arithmetic operations (+, -, \*, /)
- Handle decimal inputs
- Include clear and delete functionality
- Provide error handling for invalid inputs (e.g., division by zero)
- Maintain a history of last 5 calculations
- Have a responsive pastel-themed UI

### Expectation

- Generate complete working Python code
- Follow modular architecture (logic + UI separation)
- Ensure code readability and maintainability
- Provide error-free execution

## Architecture

### Logic Layer (CalculatorLogic class)

- Handles all mathematical computation
- Manages calculation history (last 5 entries)
- Provides safe expression evaluation

### UI Layer (CalculatorUI class)

- Creates all graphical components
- Manages user interactions
- Updates display and history panel

## Files Included

- calculator.py - Main application code
- agents.md - Agent definition
- skills.md - Required skills

## How to Run

```bash
python calculator.py
```

## Color Palette (Pastel Theme)

| Element          | Color Code              |
| ---------------- | ----------------------- |
| Background       | #F5E6D3 (Cream)         |
| Display          | #FFF8F0 (White)         |
| Number Buttons   | #D6E4FF (Pastel Blue)   |
| Operator Buttons | #FFD6E0 (Pastel Pink)   |
| Function Buttons | #E8D5FF (Pastel Purple) |
| Equals Button    | #C8F7C5 (Pastel Green)  |
| Clear Button     | #FFCCE0 (Pastel Red)    |
| History Panel    | #FFF5CC (Pastel Yellow) |

---

_Submitted as part of NASSCOM AI Workshop Assessment_
