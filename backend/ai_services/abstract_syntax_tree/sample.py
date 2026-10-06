class Car:
    """
    A simple class to represent a Car.
    """
    # The constructor method initializes the object's attributes
    def __init__(self, brand, model, year):
        self.brand = brand     # Instance attribute
        self.model = model     # Instance attribute
        self.year = year       # Instance attribute
        self.odometer = 0      # Default attribute value

    # A method to display information about the car
    def get_description(self):
        return f"{self.year} {self.brand} {self.model}"

    # A method that takes an argument to update an attribute
    def drive(self, miles):
        if miles > 0:
            self.odometer += miles
            print(f"Drove {miles} miles.")
        else:
            print("You can't drive backwards!")

    # A method to read the current odometer status
    def read_odometer(self):
        return f"This car has {self.odometer} miles on it."


# --- Example Usage ---

# 1. Create an instance (object) of the Car class
my_car = Car("Toyota", "Corolla", 2024)

# 2. Access attributes and call methods
print(my_car.get_description())  # Output: 2024 Toyota Corolla

# 3. Modify attributes through methods
my_car.drive(150)                # Output: Drove 150 miles.
print(my_car.read_odometer())    # Output: This car has 150 miles on it.
