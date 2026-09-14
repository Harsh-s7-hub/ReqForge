def calculate_discount(price, percentage):
    """Calculate the discounted price."""
    return price * (1 - percentage / 100)


def calculate_tax(price, tax_rate):
    """Calculate the tax amount."""
    return price * (tax_rate / 100)


def calculate_total(price, tax_rate):
    """Calculate the total price including tax."""
    tax = calculate_tax(price, tax_rate)
    return price + tax
