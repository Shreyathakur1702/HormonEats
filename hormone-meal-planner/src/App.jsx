import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const categories = ["Breakfast", "Lunch", "Snacks", "Dinner"];

const ingredientsByConcern = {
  "PCOS/PCOD": [
    "Spinach", "Kale", "Broccoli", "Quinoa", "Lentils", "Tofu (Veg)", "Salmon (Non-Veg)", "Flaxseeds", "Chia Seeds", 
    "Pumpkin Seeds", "Walnuts", "Almonds", "Greek Yogurt", "Sweet Potatoes", "Whole Oats", "Brown Rice", "Coconut Milk",
    "Avocado", "Zucchini", "Cottage Cheese (Paneer)", "Basil Seeds", "Multi-grain flour"
  ],
  "Weight Loss": [
    "Avocado", "Almonds", "Greek Yogurt", "Berries", "Salmon (Non-Veg)", "Cottage Cheese (Veg)", "Quinoa", "Chia Seeds", 
    "Flaxseeds", "Pumpkin Seeds", "Eggs (Non-Veg)", "Oats", "Brown Rice", "Multi-grain flour", "Sweet Potatoes", "Spinach",
    "Mushrooms", "Zucchini", "Bell Peppers", "Tomatoes", "Cucumber"
  ],
  "Iron Deficiency": [
    "Spinach", "Lentils", "Tofu (Veg)", "Beets", "Pumpkin Seeds", "Salmon (Non-Veg)", "Eggs (Non-Veg)", "Brown Rice", "Chickpeas", "Dates", 
    "Pistachios", "Sesame Seeds", "Dark Chocolate (85%)", "Cabbage", "Fenugreek Leaves", "Quinoa", "Soybeans", "Cashews",
    "Raisins", "Mushrooms", "Multi-grain flour"
  ],
  "Protein Deficiency": [
    "Quinoa", "Lentils", "Eggs (Non-Veg)", "Tofu (Veg)", "Chicken (Non-Veg)", "Salmon (Non-Veg)", "Fish (Non-Veg)", "Cottage Cheese (Paneer)", 
    "Multigrain Flour", "Soy Chunks", "Greek Yogurt", "Milk", "Peanut Butter", "Chickpeas", "Moong Dal", "Black Beans", 
    "Walnuts", "Oats", "Chia Seeds", "Sunflower Seeds", "Pumpkin Seeds", "Multi-grain flour"
  ],
  "Acne-Friendly": [
    "Cucumbers", "Carrots", "Bell Peppers", "Berries", "Greek Yogurt", "Nuts", "Whole Oats", "Pumpkin Seeds", "Flaxseeds", 
    "Coconut Water", "Turmeric", "Tomatoes", "Green Tea", "Dark Chocolate (85%)", "Lemon", "Papaya", "Broccoli", "Zucchini",
    "Brown Rice", "Sweet Potatoes", "Chia Seeds", "Salmon (Non-Veg)", "Sardines (Non-Veg)", "Eggs (Non-Veg)", "Turkey (Non-Veg)", "Shrimp (Non-Veg)", "Multi-grain flour"
  ],
};


const App = () => {
  const [loading, setLoading] = useState(false);
  const [concern, setConcern] = useState(localStorage.getItem("concern") || "PCOS/PCOD");
  const [selectedIngredients, setSelectedIngredients] = useState(
    JSON.parse(localStorage.getItem("selectedIngredients")) || []
  );
  const [mealPlans, setMealPlans] = useState({ Breakfast: [], Lunch: [], Snacks: [], Dinner: [] });
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [vegOnly, setVegOnly] = useState(localStorage.getItem("vegOnly") === "true");

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (selectedIngredients.length > 0) {
      fetchMeals();
    }
  }, [selectedIngredients]); 

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode);
  };

  const toggleVegOnly = () => {
    const newVegOnly = !vegOnly;
    setVegOnly(newVegOnly);
    localStorage.setItem("vegOnly", newVegOnly);
  };

  const toggleIngredient = (ingredient) => {
    setSelectedIngredients((prev) => {
      const updatedIngredients = prev.includes(ingredient)
        ? prev.filter((item) => item !== ingredient)
        : [...prev, ingredient];
      localStorage.setItem("selectedIngredients", JSON.stringify(updatedIngredients));
      return updatedIngredients;
    });
  };

const isVegetarian = (meal) => {
  // List of non-vegetarian ingredients to check
  const nonVegIngredients = [
    "chicken", "eggs", "beef", "pork", "lamb", "fish", "shrimp", "prawn", "crab", "meat", "bacon", "sausage", "salmon"
  ];

  // Check meal name and instructions for non-vegetarian ingredients
  const mealText = `${meal.strMeal.toLowerCase()} ${meal.strInstructions.toLowerCase()}`;
  return !nonVegIngredients.some(ing => mealText.includes(ing));
};
const isDessert = (meal) => {
  const dessertKeywords = [
    "dessert", "cake", "pie", "pudding", "ice cream", "cookie", "brownie", 
    "tart", "pastry", "chocolate", "sweet", "custard", "mousse", "cheesecake"
  ];
  const mealText = `${meal.strMeal.toLowerCase()} ${meal.strCategory.toLowerCase()}`;
  return dessertKeywords.some(keyword => mealText.includes(keyword));
};
const fetchMeals = async () => {
  if (selectedIngredients.length === 0) return;

  try {
    setLoading(true);

    // Fetch meals for all selected ingredients
    const responses = await Promise.all(
      selectedIngredients.map((ingredient) =>
        axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient.split(' ')[0]}`)
      )
    );

    // Combine all meals and remove duplicates
    const allMeals = responses.flatMap((res) => res.data.meals || []);
    const uniqueMeals = Array.from(new Map(allMeals.map((m) => [m.idMeal, m])).values());

    // Fetch full details for each meal
    const mealDetails = await Promise.all(
      uniqueMeals.map((meal) =>
        axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`)
      )
    );

    // Filter out beef, bacon, and pork entirely
const allFilteredMeals = mealDetails
.map((res) => res.data.meals[0])
.filter((meal) => {
  const mealText = `${meal.strMeal.toLowerCase()} ${meal.strInstructions.toLowerCase()}`;
  return !['beef', 'bacon', 'pork'].some(ing => mealText.includes(ing));
})
.filter((meal) => !vegOnly || isVegetarian(meal)); // Apply vegetarian filter

// Separate desserts and non-desserts
const desserts = allFilteredMeals.filter((meal) => isDessert(meal));
const nonDesserts = allFilteredMeals.filter((meal) => !isDessert(meal));

// Exclude desserts only for "Weight Loss" concern
const finalDesserts = concern === "Weight Loss" ? [] : desserts;

const fallbackDessert = {
  idMeal: "fallback1",
  strMeal: "Banana Pancakes",
  strMealThumb: "https://www.themealdb.com/images/media/meals/sywswr1511383814.jpg",
  strInstructions: "You can skip eggs or add dark chocolate syrup, your rules!",
};

// Add fallback dessert if no desserts are found
if (finalDesserts.length === 0 && concern !== "Weight Loss") {
  finalDesserts.push(fallbackDessert);
}

// Shuffle meals for random selection
const shuffledDesserts = finalDesserts.sort(() => 0.5 - Math.random());
const shuffledNonDesserts = nonDesserts.sort(() => 0.5 - Math.random());

// Assign meals to categories
const categorizedMeals = {
Breakfast: [],
Lunch: [],
Snacks: [],
Dinner: [],
};

// Distribute desserts and non-desserts
const categories = Object.keys(categorizedMeals);
let dessertIndex = 0;

categories.forEach((category) => {
// Add one dessert (if available)
if (shuffledDesserts[dessertIndex]) {
  categorizedMeals[category].push(shuffledDesserts[dessertIndex]);
  dessertIndex++;
}

// Add one non-dessert (if available)
const nonDessert = shuffledNonDesserts.find(
  (meal) => !Object.values(categorizedMeals).flat().includes(meal)
);
if (nonDessert) {
  categorizedMeals[category].push(nonDessert);
}
});

// Fallback: If any category is empty, fill it with remaining meals
categories.forEach((category) => {
if (categorizedMeals[category].length === 0) {
  const remainingMeals = [...shuffledDesserts, ...shuffledNonDesserts].filter(
    (meal) => !Object.values(categorizedMeals).flat().includes(meal)
  );
  if (remainingMeals.length > 0) {
    categorizedMeals[category].push(remainingMeals[0]);
  }
}
});

setMealPlans(categorizedMeals);
  } catch (error) {
    // Handle errors silently
  } finally {
    setLoading(false);
  }
};



  return (
    <div className={`container ${darkMode ? "dark" : ""}`}>
      <h1>Hormone-Friendly Meal Planner</h1>

      <div className="toggles">
        <button onClick={toggleDarkMode}>{darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}</button>
        <button onClick={toggleVegOnly}>{vegOnly ?  "🍗 Include Non-Veg" : "🍃 Veg Only"}</button>
      </div>

      <div className="section">
        <label>Select Your Concern: </label>
        <select
  value={concern}
  onChange={(e) => {
    const newConcern = e.target.value;
    setConcern(newConcern);
    localStorage.setItem("concern", newConcern);
    setSelectedIngredients([]);
    localStorage.setItem("selectedIngredients", JSON.stringify([]));
    setMealPlans({ Breakfast: [], Lunch: [], Snacks: [], Dinner: [] }); // Reset meals
  }}
>
        
          {Object.keys(ingredientsByConcern).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>

      <div className="ingredients">
        {ingredientsByConcern[concern]
          .filter((ingredient) => !vegOnly || !ingredient.includes("(Non-Veg)"))
          .map((ingredient) => (
            <label key={ingredient} className="ingredient">
              <input
                type="checkbox"
                checked={selectedIngredients.includes(ingredient)}
                onChange={() => toggleIngredient(ingredient)}
              />
              {ingredient.replace(" (Veg)", "").replace(" (Non-Veg)", "")}
            </label>
          ))}
      </div>

      <button className="generate-btn" onClick={fetchMeals}>
        Generate Meal Plan
      </button>

      {categories.map((category) => (
  <div key={category} className="meal-category">
    <h2>{category}</h2>
    <div className="meal-cards">
      {loading ? (
        <div className="loading-spinner">⏳ Loading meals for {category}...</div>
      ) : mealPlans[category]?.length > 0 ? (
        mealPlans[category].map((meal) => (
          <div key={meal.idMeal} className="meal-card">
            <img src={meal.strMealThumb} alt={meal.strMeal} />
            <h3>{meal.strMeal}</h3>
            <a
              href={`https://www.themealdb.com/meal/${meal.idMeal}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Recipe
            </a>
          </div>
        ))
      ) : (
        <div className="fallback-message">
          <p>No meals found for {category}. Try these ingredients:</p>
          <ul>
            {ingredientsByConcern[concern]
              .filter((ing) => !vegOnly || !ing.includes("(Non-Veg)"))
              .slice(0, 3)
              .map((ing) => (
                <li key={ing}>{ing.replace(" (Veg)", "").replace(" (Non-Veg)", "")}</li>
              ))}
          </ul>
        </div>
      )}
    </div>
  </div>
))}
    </div>
  );
};

export default App;
