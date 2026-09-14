# Function: calculate_discount

**Source file:** src/calculator.py

## Documentation

```python
def calculate_discount(price, percentage):
    """Calculate the discounted price."""
    return price * (1 - percentage / 100)

# Parameters
# - price: float - Original price of the item
# - percentage: float - Discount percentage (e.g., 10 for 10% discount)

# How it works
# This function multiplies the original price by the discount factor (1 - percentage/100), 
# returning the new price after applying the discount.

**Latency:** 63.72 seconds

**Model:** qwen3:0.6b

---

# Function: calculate_tax

**Source file:** src/calculator.py

## Documentation

```python
def calculate_tax(price, tax_rate):
    """Calculate the tax amount based on the given price and tax rate."""
    return price * (tax_rate / 100)

def calculate_tax(price, tax_rate):
    """Calculate the tax amount."""
    return price * (tax_rate / 100)

```

**Latency:** 81.24 seconds

**Model:** qwen3:0.6b

---

# Function: calculate_total

**Source file:** src/calculator.py

## Documentation

1. **Purpose of the function**  
   Calculate the total price including tax by adding the base price and the tax calculated based on the provided tax rate.

2. **Parameters**  
   - `price`: A floating-point number representing the base price.  
   - `tax_rate`: A floating-point number representing the tax rate (e.g., 0.05 for 5% tax).  

3. **Return value**  
   Returns the total price after including tax: `price + tax`.

4. **Brief explanation of how the function works**  
   The function calculates the tax using the formula: `tax = price * tax_rate`, then returns the sum of the base price and the tax.

**Latency:** 35.51 seconds

**Model:** qwen3:0.6b

---

