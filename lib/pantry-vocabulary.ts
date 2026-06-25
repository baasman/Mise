// Curated ingredient vocabulary for the pantry-expansion batch (scripts/profile-pantry.ts).
// ~400 culinary ingredients grouped by category (FlavorDB-style taxonomy). Names are
// facts, not copyrightable; the category is passed to Claude as grounding so estimates
// are better calibrated. The batch profiler derives a slug per name and skips any that
// already exist in the pantry, so overlaps with the seed 30 are harmless.

export interface VocabGroup {
  category: string;
  items: string[];
}

export const VOCABULARY: VocabGroup[] = [
  {
    category: "Alliums",
    items: ["Garlic", "Yellow onion", "Red onion", "Sweet onion", "Shallot", "Leek", "Scallion", "Chives", "Spring onion", "Ramps"],
  },
  {
    category: "Root & tuber vegetables",
    items: ["Carrot", "Parsnip", "Red beet", "Golden beet", "Turnip", "Rutabaga", "Celeriac", "Potato", "Sweet potato", "Daikon", "Red radish", "Watermelon radish", "Jicama", "Sunchoke", "Lotus root", "Salsify"],
  },
  {
    category: "Brassicas",
    items: ["Broccoli", "Cauliflower", "Romanesco", "Brussels sprout", "Green cabbage", "Red cabbage", "Savoy cabbage", "Napa cabbage", "Kale", "Cavolo nero", "Collard greens", "Kohlrabi", "Broccolini", "Bok choy"],
  },
  {
    category: "Fruiting & nightshade vegetables",
    items: ["Tomato", "Cherry tomato", "Sun-dried tomato", "Eggplant", "Bell pepper", "Poblano pepper", "Zucchini", "Yellow squash", "Cucumber", "Tomatillo", "Okra", "Padron pepper", "Shishito pepper"],
  },
  {
    category: "Squash & gourds",
    items: ["Butternut squash", "Kabocha squash", "Acorn squash", "Pumpkin", "Delicata squash", "Spaghetti squash"],
  },
  {
    category: "Leafy & salad greens",
    items: ["Spinach", "Arugula", "Watercress", "Romaine", "Little gem lettuce", "Radicchio", "Belgian endive", "Frisee", "Swiss chard", "Mustard greens", "Dandelion greens", "Sorrel", "Treviso", "Purslane"],
  },
  {
    category: "Legumes & pulses",
    items: ["Chickpea", "Black bean", "Cannellini bean", "Pinto bean", "Kidney bean", "Green lentil", "Red lentil", "Black lentil", "Fava bean", "Edamame", "Green pea", "Snap pea", "Split pea", "Butter bean", "Borlotti bean"],
  },
  {
    category: "Mushrooms & fungi",
    items: ["Button mushroom", "Cremini mushroom", "Portobello", "Shiitake", "Oyster mushroom", "Maitake", "King trumpet mushroom", "Enoki", "Chanterelle", "Dried porcini", "Morel", "Black truffle"],
  },
  {
    category: "Grains & starches",
    items: ["White rice", "Brown rice", "Basmati rice", "Jasmine rice", "Arborio rice", "Sushi rice", "Wild rice", "Farro", "Pearl barley", "Freekeh", "Bulgur", "Quinoa", "Polenta", "Couscous", "Israeli couscous", "Semolina", "Steel-cut oats", "Buckwheat", "Millet"],
  },
  {
    category: "Pasta & noodles",
    items: ["Spaghetti", "Rigatoni", "Orecchiette", "Pappardelle", "Gnocchi", "Soba noodles", "Udon noodles", "Rice noodles", "Egg noodles", "Ramen noodles"],
  },
  {
    category: "Breads & baked starches",
    items: ["Focaccia", "Baguette", "Pita", "Corn tortilla", "Naan", "Brioche", "Rye bread", "Cornbread"],
  },
  {
    category: "Nuts & seeds",
    items: ["Almond", "Hazelnut", "Pistachio", "Pecan", "Cashew", "Pine nut", "Macadamia", "Peanut", "Chestnut", "Pumpkin seed", "Sunflower seed", "Sesame seed", "Flax seed", "Poppy seed", "Hemp seed"],
  },
  {
    category: "Fresh herbs",
    items: ["Basil", "Thai basil", "Cilantro", "Flat-leaf parsley", "Dill", "Tarragon", "Chervil", "Oregano", "Marjoram", "Thyme", "Rosemary", "Sage", "Bay leaf", "Curry leaf", "Shiso", "Lovage", "Fennel fronds"],
  },
  {
    category: "Dried spices",
    items: ["Black peppercorn", "White peppercorn", "Cumin", "Coriander seed", "Fennel seed", "Caraway seed", "Yellow mustard seed", "Turmeric", "Cinnamon", "Green cardamom", "Clove", "Nutmeg", "Allspice", "Star anise", "Sumac", "Za'atar", "Ras el hanout", "Garam masala", "Curry powder", "Saffron", "Sweet paprika", "Cayenne", "Fenugreek", "Ajwain", "Mace", "Juniper berry", "Grains of paradise", "Mahleb"],
  },
  {
    category: "Chiles & hot peppers",
    items: ["Jalapeño", "Serrano", "Habanero", "Thai bird chili", "Fresno chili", "Guajillo chili", "Ancho chili", "Chipotle", "Calabrian chili", "Gochugaru", "Aleppo pepper", "Scotch bonnet", "Cascabel chili"],
  },
  {
    category: "Citrus",
    items: ["Lemon", "Lime", "Orange", "Blood orange", "Grapefruit", "Meyer lemon", "Yuzu", "Kumquat", "Bergamot", "Key lime", "Mandarin", "Calamansi"],
  },
  {
    category: "Berries",
    items: ["Strawberry", "Raspberry", "Blackberry", "Blueberry", "Cranberry", "Red currant", "Gooseberry", "Black currant"],
  },
  {
    category: "Stone fruit",
    items: ["Peach", "Nectarine", "Apricot", "Plum", "Sweet cherry", "Sour cherry", "Pluot"],
  },
  {
    category: "Pome & vine fruit",
    items: ["Apple", "Green apple", "Pear", "Quince", "Fresh fig", "Green grape", "Concord grape", "Persimmon", "Rhubarb", "Cantaloupe", "Watermelon"],
  },
  {
    category: "Tropical fruit",
    items: ["Mango", "Pineapple", "Banana", "Passion fruit", "Papaya", "Lychee", "Young coconut", "Guava", "Plantain", "Starfruit"],
  },
  {
    category: "Dried fruit",
    items: ["Raisin", "Golden raisin", "Dried apricot", "Dried fig", "Dried cherry", "Prune", "Dried cranberry", "Medjool date"],
  },
  {
    category: "Dairy & eggs",
    items: ["Cultured butter", "Heavy cream", "Crème fraîche", "Sour cream", "Buttermilk", "Whole milk", "Mascarpone", "Ricotta", "Cottage cheese", "Hen egg", "Duck egg", "Ghee", "Labneh"],
  },
  {
    category: "Cheese",
    items: ["Sharp cheddar", "Gruyère", "Comté", "Manchego", "Pecorino romano", "Aged gouda", "Fontina", "Taleggio", "Gorgonzola", "Roquefort", "Feta", "Halloumi", "Fresh mozzarella", "Burrata", "Goat cheese", "Brie", "Cotija", "Emmental"],
  },
  {
    category: "Cured meats & charcuterie",
    items: ["Prosciutto", "Pancetta", "Guanciale", "Smoked bacon", "Soppressata", "Genoa salami", "Spanish chorizo", "Nduja", "Bresaola", "Mortadella", "Coppa", "Lardo"],
  },
  {
    category: "Meat, poultry & game",
    items: ["Chicken thigh", "Chicken breast", "Duck breast", "Pork shoulder", "Pork belly", "Beef short rib", "Ribeye", "Ground beef", "Lamb shoulder", "Lamb chop", "Veal", "Rabbit", "Venison", "Ground pork", "Oxtail", "Turkey breast"],
  },
  {
    category: "Seafood & shellfish",
    items: ["Salmon", "Tuna", "Cod", "Halibut", "Sea bass", "Branzino", "Mackerel", "Sardine", "Trout", "Red snapper", "Sea scallop", "Shrimp", "Lobster", "Dungeness crab", "Mussel", "Manila clam", "Oyster", "Squid", "Octopus", "Sea urchin"],
  },
  {
    category: "Cured & preserved fish",
    items: ["Smoked salmon", "Bottarga", "Salt cod", "Smoked trout", "Salmon roe", "Cured mackerel"],
  },
  {
    category: "Ferments & pickles",
    items: ["Kimchi", "Sauerkraut", "Gochujang", "Doenjang", "Fish sauce", "Soy sauce", "Tamari", "Oyster sauce", "Hoisin sauce", "Black garlic", "Pickled ginger", "Natto", "Tempeh", "Red miso", "Pickled mustard greens", "Fermented black bean"],
  },
  {
    category: "Soy & plant proteins",
    items: ["Firm tofu", "Silken tofu", "Smoked tofu", "Seitan", "Yuba"],
  },
  {
    category: "Condiments, sauces & pastes",
    items: ["Tomato paste", "Harissa", "Sambal oelek", "Chili oil", "Sriracha", "Ketchup", "Mayonnaise", "Aioli", "Whole grain mustard", "Peanut butter", "Almond butter", "Basil pesto", "Chimichurri", "Romesco", "Ssamjang", "Worcestershire sauce", "XO sauce", "Tomato passata"],
  },
  {
    category: "Oils & fats",
    items: ["Grapeseed oil", "Sesame oil", "Toasted sesame oil", "Coconut oil", "Walnut oil", "Avocado oil", "Duck fat", "Lard", "Schmaltz", "Clarified butter", "Pumpkin seed oil"],
  },
  {
    category: "Acids & vinegars",
    items: ["Red wine vinegar", "White wine vinegar", "Rice vinegar", "Balsamic vinegar", "Apple cider vinegar", "Champagne vinegar", "Malt vinegar", "Verjus", "Lemon juice", "Lime juice", "Black vinegar"],
  },
  {
    category: "Sweeteners",
    items: ["Granulated sugar", "Brown sugar", "Maple syrup", "Blackstrap molasses", "Agave nectar", "Date syrup", "Muscovado sugar", "Demerara sugar", "Golden syrup", "Palm sugar", "Sorghum syrup"],
  },
  {
    category: "Sea vegetables",
    items: ["Nori", "Kombu", "Wakame", "Dulse", "Hijiki"],
  },
  {
    category: "Aromatics & specialty",
    items: ["Galangal", "Lemongrass", "Makrut lime leaf", "Fresh turmeric", "Wasabi", "Tamarind", "Preserved lime", "Fresh bay leaf", "Curry paste", "Asafoetida"],
  },
  {
    category: "Chocolate, coffee, tea & botanicals",
    items: ["Cocoa powder", "Milk chocolate", "White chocolate", "Espresso", "Brewed coffee", "Matcha", "Black tea", "Vanilla bean", "Tonka bean", "Dried rose petal", "Orange blossom water", "Rose water"],
  },
  {
    category: "Wine & spirits for cooking",
    items: ["Dry white wine", "Dry red wine", "Dry sherry", "Marsala wine", "Tawny port", "Sake", "Mirin", "Brandy", "Dark rum"],
  },
];

// Flat list of names, de-duplicated (case-insensitive), for the batch profiler.
export const VOCAB_NAMES: string[] = Array.from(
  new Map(VOCABULARY.flatMap((g) => g.items).map((n) => [n.toLowerCase(), n])).values(),
);

// name (lowercased) -> category, used as grounding context for the estimate.
export const VOCAB_CATEGORY: Record<string, string> = Object.fromEntries(
  VOCABULARY.flatMap((g) => g.items.map((n) => [n.toLowerCase(), g.category])),
);
