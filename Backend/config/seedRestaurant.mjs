const restaurants = [
  {
    name: "Tatiana by Kwame Onwuachi",
    cuisine: "Afro-Caribbean",
    visitDate: "2025-01-25",
    ratings: { food: 4.5, service: 4, ambience: 3.5, value: 3.5 },
    notes: {
      food: "Short rib pastrami and curried goat patties were the standouts.",
      service: "",
      ambience: "",
      value: "",
    },
    finalScore: 3.9,
    review:
      "Destination-making short rib pastrami, braised oxtails, crispy okra and curried goat patties are highlights among outstanding Afro-Caribbean menu items",
    priceRange: "$$$",
    image:
      "https://res.cloudinary.com/dnc7potxo/image/upload/v1738005142/DineDiary/img-6_xshxly.jpg",
    userId: "6797c2071cdc7bcba9e84ec0",
  },
  {
    name: "Gage & Tollner",
    cuisine: "New-American",
    visitDate: "2024-07-19",
    ratings: { food: 5, service: 4.5, ambience: 5, value: 4 },
    notes: {
      food: "Excellent fried chicken and a comforting creamed spinach.",
      service: "",
      ambience: "The restored dining room is stunning.",
      value: "",
    },
    finalScore: 4.6,
    review:
      "Steaks and chops and raw bar items and excellent fried chicken. The creamed spinach is also a nice, comforting side, and the devils on horseback, which wrap dates and smoked almonds in bacon, are a sweet/salty treat",
    priceRange: "$$$$",
    image:
      "https://res.cloudinary.com/dnc7potxo/image/upload/v1738005141/DineDiary/img-4_nswflr.jpg",
    userId: "6797c2071cdc7bcba9e84ec0",
  },
  {
    name: "Rezdôra",
    cuisine: "Italian",
    visitDate: "2024-09-21",
    ratings: { food: 4.5, service: 4, ambience: 3.5, value: 4 },
    notes: { food: "", service: "", ambience: "", value: "" },
    finalScore: 4,
    review:
      "Rezdôra is now the best Italian restaurant in New York City, leading a list of venerable institutions. Its terrific regional pasta tasting is still $98, and favorites like anolini di parma, tagliolini al ragu and the famed grandma walking through forest in Emilia (Cappelletti verdi with roasted, sautéed leeks and black mushroom purée) are available à la carte, as well",
    priceRange: "$$$",
    image:
      "https://res.cloudinary.com/dnc7potxo/image/upload/v1738005143/DineDiary/img-9_lbevvo.jpg",
    userId: "6797c2071cdc7bcba9e84ec0",
  },
  {
    name: "Gramercy Tavern",
    cuisine: "American",
    visitDate: "2024-11-03",
    ratings: { food: 3.5, service: 4, ambience: 3, value: 2.5 },
    notes: { food: "", service: "", ambience: "", value: "" },
    finalScore: 3.3,
    review:
      "It’s the special sort of spot where you arrange to go after you’ve become engaged, or simply slip into to escape a sudden rain",
    priceRange: "$$",
    image:
      "https://res.cloudinary.com/dnc7potxo/image/upload/v1738005141/DineDiary/img-2_edgtdk.jpg",
    userId: "6797c2071cdc7bcba9e84ec0",
  },
  {
    name: "Sushi Nakazawa",
    cuisine: "Japanese",
    visitDate: "2025-01-07",
    ratings: { food: 5, service: 4.5, ambience: 4, value: 3 },
    notes: {
      food: "Every piece of the omakase was flawless.",
      service: "",
      ambience: "",
      value: "",
    },
    finalScore: 4.1,
    review:
      "Incredible omakase from Jiro Dreams of Sushi’s chef Daisuke Nakazawa",
    priceRange: "$$$",
    image:
      "https://res.cloudinary.com/dnc7potxo/image/upload/v1738005143/DineDiary/img-10_eqo8hr.jpg",
    userId: "6797c2071cdc7bcba9e84ec0",
  },
  {
    name: "Via Carota",
    cuisine: "Italian",
    visitDate: "2024-03-12",
    ratings: { food: 4.5, service: 3.5, ambience: 4, value: 3.5 },
    notes: { food: "", service: "", ambience: "", value: "" },
    finalScore: 3.9,
    review:
      "The simple food—towering insalata verde, hearty chopped steak and any of the soul-satisfying pastas—makes this Village favorite a place where everyone wants to be a regular",
    priceRange: "$$$$",
    image:
      "https://res.cloudinary.com/dnc7potxo/image/upload/v1738005141/DineDiary/img-1_hfepnh.jpg",
    userId: "6797c2071cdc7bcba9e84ec0",
  },
  {
    name: "Sailor",
    cuisine: "American",
    visitDate: "2024-04-08",
    ratings: { food: 4, service: 4, ambience: 4.5, value: 4 },
    notes: { food: "", service: "", ambience: "", value: "" },
    finalScore: 4.1,
    review:
      "Chilled martinis. Veggies that sway with the season. And a roast chicken that helped solidfy its spot as one of the best new restaurants of 2023",
    priceRange: "$$$",
    image:
      "https://res.cloudinary.com/dnc7potxo/image/upload/v1738005141/DineDiary/img-4_nswflr.jpg",
    userId: "6797c2071cdc7bcba9e84ec0",
  },
  {
    name: "Dhamaka",
    cuisine: "Indian",
    visitDate: "2024-06-07",
    ratings: { food: 4, service: 3, ambience: 2.5, value: 3.5 },
    notes: {
      food: "Bold, unapologetic flavors from the forgotten side of India.",
      service: "",
      ambience: "",
      value: "",
    },
    finalScore: 3.3,
    review:
      "Inside, menu items from that they call “the forgotten side of India” include gurda kapoora (goat kidney, testicles, red onion and pao) doh khleh (pork with lime, cilantro, onion and ginger) and champaran meat (mutton, garlic, red chili), which sells out fast",
    priceRange: "$$",
    image:
      "https://res.cloudinary.com/dnc7potxo/image/upload/v1738005141/DineDiary/img-3_znkvaw.jpg",
    userId: "6797c2071cdc7bcba9e84ec0",
  },
  {
    name: "K'Far",
    cuisine: "Israeli",
    visitDate: "2024-10-20",
    ratings: { food: 4.5, service: 4, ambience: 4, value: 4 },
    notes: { food: "", service: "", ambience: "", value: "" },
    finalScore: 4.1,
    review:
      "K’Far is superb on the lobby level, with large dining rooms arranged a few ways and a chicken schnitzel to recall again and again, along with savory baklava, Palestinian lamb tartare and world class dorade",
    priceRange: "$$$",
    image:
      "https://res.cloudinary.com/dnc7potxo/image/upload/v1738005142/DineDiary/img-7_ad8vuf.jpg",
    userId: "6797c2071cdc7bcba9e84ec0",
  },
  {
    name: "Kochi",
    cuisine: "Korean",
    visitDate: "2024-02-10",
    ratings: { food: 5, service: 4.5, ambience: 4, value: 4.5 },
    notes: {
      food: "The nine-course skewer tasting is a genuine experience.",
      service: "",
      ambience: "",
      value: "",
    },
    finalScore: 4.5,
    review:
      "Per se alum chef Sungchul Shim’s $145 nine-course tasting of skewers inspired by Korean royal court cuisine",
    priceRange: "$$$",
    image:
      "https://res.cloudinary.com/dnc7potxo/image/upload/v1738005141/DineDiary/img-5_ldych2.jpg",
    userId: "6797c2071cdc7bcba9e84ec0",
  },
];

export default restaurants;
