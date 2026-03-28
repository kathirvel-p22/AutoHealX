"""
============================================================================
NASSCOM AI Workshop Assignment - GUI Calculator
============================================================================
A professional-grade desktop calculator with pastel-themed UI.

Role: Expert Python Developer specializing in desktop applications
Intent: Design and implement a fully functional GUI calculator

Author: Participant
============================================================================
"""

import tkinter as tk
from tkinter import messagebox


# =============================================================================
# LOGIC LAYER - Mathematical Evaluation
# =============================================================================
class CalculatorLogic:
    """
    Handles all mathematical computation logic.
    Separated from UI for clean modular architecture.
    """
    
    def __init__(self):
        """Initialize calculator logic with empty expression and history."""
        self.expression = ""
        self.history = []  # Store last 5 calculations
        self.current_input = "0"
    
    def add_digit(self, digit: str) -> str:
        """Add a digit or decimal point to current input."""
        if self.current_input == "0" and digit != ".":
            self.current_input = digit
        elif self.current_input == "0" and digit == ".":
            self.current_input = "0."
        elif digit == "." and "." in self.current_input:
            return self.current_input
        else:
            self.current_input += digit
        return self.current_input
    
    def add_operator(self, operator: str) -> None:
        """Add operator and prepare for next number."""
        self.expression += self.current_input + operator
        self.current_input = "0"
    
    def clear_all(self) -> str:
        """Clear entire expression and reset."""
        self.current_input = "0"
        self.expression = ""
        return "0"
    
    def clear_entry(self) -> str:
        """Clear only current input."""
        self.current_input = "0"
        return self.current_input
    
    def delete_last(self) -> str:
        """Delete last character from current input."""
        if len(self.current_input) > 1:
            self.current_input = self.current_input[:-1]
        else:
            self.current_input = "0"
        return self.current_input
    
    def toggle_sign(self) -> str:
        """Toggle positive/negative sign."""
        if self.current_input != "0":
            if self.current_input.startswith("-"):
                self.current_input = self.current_input[1:]
            else:
                self.current_input = "-" + self.current_input
        return self.current_input
    
    def percentage(self) -> str:
        """Convert to percentage."""
        try:
            value = float(self.current_input)
            value = value / 100
            if value.is_integer():
                value = int(value)
            self.current_input = str(value)
            return self.current_input
        except Exception:
            return "Error"
    
    def evaluate(self) -> str:
        """
        Evaluate the mathematical expression safely.
        Returns result or "Error" if evaluation fails.
        """
        try:
            full_expression = self.expression + self.current_input
            
            if not full_expression or full_expression == "0":
                return "0"
            
            # SAFE EVALUATION - Restrict to numbers and operators only
            allowed_chars = set("0123456789.+-*/() ")
            if not all(c in allowed_chars for c in full_expression):
                return "Error"
            
            # Use eval with restricted globals for security
            result = eval(full_expression, {"__builtins__": None}, {})
            
            # Format result
            if isinstance(result, float):
                if result.is_integer():
                    result = int(result)
                else:
                    result = round(result, 10)
            
            # Store in history (keep last 5)
            history_entry = f"{full_expression} = {result}"
            self.history.append(history_entry)
            if len(self.history) > 5:
                self.history.pop(0)
            
            self.expression = ""
            self.current_input = str(result)
            return str(result)
            
        except ZeroDivisionError:
            return "Error"
        except Exception:
            return "Error"
    
    def get_history(self) -> list:
        """Return the calculation history."""
        return self.history.copy()


# =============================================================================
# UI LAYER - Graphical User Interface
# =============================================================================
class CalculatorUI:
    """
    Handles the graphical user interface.
    Uses pastel colors for a clean, intuitive design.
    """
    
    def __init__(self, root: tk.Tk):
        """Initialize the calculator UI with all components."""
        self.root = root
        self.logic = CalculatorLogic()
        
        # Pastel color palette
        self.colors = {
            'bg': '#F5E6D3',           # Cream background
            'display_bg': '#FFF8F0',  # White display
            'display_text': '#5D5D5D', # Dark gray
            'btn_number': '#D6E4FF',   # Pastel blue
            'btn_operator': '#FFD6E0', # Pastel pink
            'btn_function': '#E8D5FF', # Pastel purple
            'btn_equals': '#C8F7C5',  # Pastel green
            'btn_clear': '#FFCCE0',   # Pastel red
            'btn_history': '#FFF5CC', # Pastel yellow
        }
        
        self._setup_window()
        self._create_display()
        self._create_history_panel()
        self._create_buttons()
        self._bind_keyboard()
    
    def _setup_window(self) -> None:
        """Configure window properties."""
        self.root.title("Advanced Pastel Calculator")
        self.root.geometry("380x550")
        self.root.configure(bg=self.colors['bg'])
        self.root.resizable(False, False)
        
        # Center window
        self.root.update_idletasks()
        x = (self.root.winfo_screenwidth() // 2) - (380 // 2)
        y = (self.root.winfo_screenheight() // 2) - (550 // 2)
        self.root.geometry(f'380x550+{x}+{y}')
    
    def _create_display(self) -> None:
        """Create the main display screen."""
        display_frame = tk.Frame(
            self.root,
            bg=self.colors['display_bg'],
            relief='sunken',
            bd=2
        )
        display_frame.pack(padx=12, pady=(12, 6), fill='x')
        
        # Expression display
        self.expr_label = tk.Label(
            display_frame,
            text="",
            font=('Arial', 11),
            bg=self.colors['display_bg'],
            fg='#888888',
            anchor='e',
            padx=10
        )
        self.expr_label.pack(fill='x')
        
        # Main display
        self.display = tk.Entry(
            display_frame,
            text="0",
            font=('Arial', 32, 'bold'),
            bg=self.colors['display_bg'],
            fg=self.colors['display_text'],
            bd=0,
            justify='right',
            insertwidth=2
        )
        self.display.insert(0, "0")
        self.display.pack(fill='x', padx=10, pady=(0, 8))
    
    def _create_history_panel(self) -> None:
        """Create calculation history panel."""
        history_frame = tk.Frame(
            self.root,
            bg=self.colors['btn_history'],
            relief='flat',
            bd=1
        )
        history_frame.pack(padx=12, pady=4, fill='x')
        
        tk.Label(
            history_frame,
            text="History",
            font=('Arial', 10, 'bold'),
            bg=self.colors['btn_history'],
            fg='#666666'
        ).pack(anchor='w', padx=8, pady=(4, 2))
        
        self.history_listbox = tk.Listbox(
            history_frame,
            height=4,
            font=('Arial', 9),
            bg='#FFFDF5',
            fg='#555555',
            bd=0,
            highlightthickness=0
        )
        self.history_listbox.pack(fill='x', padx=8, pady=(0, 6))
    
    def _update_history_display(self) -> None:
        """Update the history listbox."""
        self.history_listbox.delete(0, tk.END)
        for item in self.logic.get_history():
            self.history_listbox.insert(tk.END, item)
    
    def _create_buttons(self) -> None:
        """Create all calculator buttons."""
        button_frame = tk.Frame(self.root, bg=self.colors['bg'])
        button_frame.pack(padx=10, pady=(6, 12), fill='both', expand=True)
        
        # Button layout: [row, col, colspan, text, color, command]
        buttons = [
            # Row 0: Clear, CE, Backspace, Divide
            [0, 0, 1, 'C', self.colors['btn_clear'], lambda: self._handle_action('C')],
            [0, 1, 1, 'CE', self.colors['btn_function'], lambda: self._handle_action('CE')],
            [0, 2, 1, 'DEL', self.colors['btn_function'], lambda: self._handle_action('DEL')],
            [0, 3, 1, '/', self.colors['btn_operator'], lambda: self._handle_operator('/')],
            
            # Row 1: 7, 8, 9, Multiply
            [1, 0, 1, '7', self.colors['btn_number'], lambda: self._handle_digit('7')],
            [1, 1, 1, '8', self.colors['btn_number'], lambda: self._handle_digit('8')],
            [1, 2, 1, '9', self.colors['btn_number'], lambda: self._handle_digit('9')],
            [1, 3, 1, '*', self.colors['btn_operator'], lambda: self._handle_operator('*')],
            
            # Row 2: 4, 5, 6, Subtract
            [2, 0, 1, '4', self.colors['btn_number'], lambda: self._handle_digit('4')],
            [2, 1, 1, '5', self.colors['btn_number'], lambda: self._handle_digit('5')],
            [2, 2, 1, '6', self.colors['btn_number'], lambda: self._handle_digit('6')],
            [2, 3, 1, '-', self.colors['btn_operator'], lambda: self._handle_operator('-')],
            
            # Row 3: 1, 2, 3, Add
            [3, 0, 1, '1', self.colors['btn_number'], lambda: self._handle_digit('1')],
            [3, 1, 1, '2', self.colors['btn_number'], lambda: self._handle_digit('2')],
            [3, 2, 1, '3', self.colors['btn_number'], lambda: self._handle_digit('3')],
            [3, 3, 1, '+', self.colors['btn_operator'], lambda: self._handle_operator('+')],
            
            # Row 4: +/-, %, 0, ., =
            [4, 0, 1, '+/-', self.colors['btn_function'], lambda: self._handle_action('+/-')],
            [4, 1, 1, '%', self.colors['btn_function'], lambda: self._handle_action('%')],
            [4, 2, 1, '0', self.colors['btn_number'], lambda: self._handle_digit('0')],
            [4, 3, 1, '.', self.colors['btn_number'], lambda: self._handle_digit('.')],
            [4, 4, 1, '=', self.colors['btn_equals'], self._handle_equals],
        ]
        
        # Create buttons
        for row, col, colspan, text, bg_color, command in buttons:
            btn = tk.Button(
                button_frame,
                text=text,
                command=command,
                bg=bg_color,
                font=('Arial', 16, 'bold'),
                borderwidth=0,
                relief='flat',
                padx=10,
                pady=8,
                cursor='hand2'
            )
            btn.grid(
                row=row, column=col, columnspan=colspan,
                sticky='nsew', padx=3, pady=3
            )
        
        # Grid configuration
        for i in range(5):
            button_frame.rowconfigure(i, weight=1)
        for i in range(5):
            button_frame.columnconfigure(i, weight=1)
    
    def _bind_keyboard(self) -> None:
        """Bind keyboard keys to calculator functions."""
        self.root.bind('<Return>', lambda e: self._handle_equals())
        self.root.bind('<BackSpace>', lambda e: self._handle_action('DEL'))
        self.root.bind('<Escape>', lambda e: self._handle_action('C'))
        
        for key in '0123456789':
            self.root.bind(key, lambda e, k=key: self._handle_digit(k))
        
        for key in '+-*/.':
            self.root.bind(key, lambda e, k=key: self._handle_operator(k) if k != '.' else self._handle_digit('.'))
    
    def _update_display(self) -> None:
        """Update the display with current values."""
        self.display.delete(0, tk.END)
        self.display.insert(0, self.logic.current_input)
        
        # Update expression label
        if self.logic.expression:
            self.expr_label.config(text=self.logic.expression)
        else:
            self.expr_label.config(text="")
    
    def _handle_digit(self, digit: str) -> None:
        """Handle digit button press."""
        result = self.logic.add_digit(digit)
        self._update_display()
    
    def _handle_operator(self, operator: str) -> None:
        """Handle operator button press."""
        self.logic.add_operator(operator)
        self._update_display()
    
    def _handle_action(self, action: str) -> None:
        """Handle action buttons (C, CE, DEL, +/-, %)."""
        if action == 'C':
            result = self.logic.clear_all()
        elif action == 'CE':
            result = self.logic.clear_entry()
        elif action == 'DEL':
            result = self.logic.delete_last()
        elif action == '+/-':
            result = self.logic.toggle_sign()
        elif action == '%':
            result = self.logic.percentage()
        else:
            result = "0"
        
        self._update_display()
    
    def _handle_equals(self) -> None:
        """Handle equals button press."""
        result = self.logic.evaluate()
        self.display.delete(0, tk.END)
        self.display.insert(0, result)
        self.expr_label.config(text="")
        self._update_history_display()
        
        # Error flash effect
        if result == "Error":
            self.display.config(fg='#E57373')
            self.root.after(500, lambda: self.display.config(fg=self.colors['display_text']))


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================
if __name__ == "__main__":
    root = tk.Tk()
    app = CalculatorUI(root)
    root.mainloop()
