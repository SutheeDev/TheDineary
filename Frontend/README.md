# Per Scholas Capstone Project (Front End)

![The Dineary](https://res.cloudinary.com/dnc7potxo/image/upload/v1738698549/ReadMe-Images/Dineary/Home.png)
<br><br>

Welcome to Per Scholas Capstone Project, where I created , [The Dineary](https://perscholascapstonefe.onrender.com/), a restaurant and dining experience journal application where users can log, manage, and organize their dining experience.

<br>

## Table of Contents

- [Design Philosophy](#design)
- [Page & Features](#pages)
- [Technologies Used](#technologies)
- [Notes](#notes)
- [Acknowledgments](#acknowledgments)
- [Feedback](#feedback)

<br>

## Design Philosophy <a name="design"></a>

- **Simple and Intuitive**: A clean and minimalistic design for ease of use.
- **Subtle Animations**: Implemented smooth transitions and animations for icons, cards, and buttons to enhance user experience.

<br>

## Pages & Features <a name="pages"></a>

### Home Page

- Displays all user restaurant entries with images, restaurant titles, and visit dates.
- A personalized greeting with the user's name (e.g., "Welcome, Pete").

### Create Restaurant Entry Page

![Create Entry Page](https://res.cloudinary.com/dnc7potxo/image/upload/v1738698477/ReadMe-Images/Dineary/Create_Entry.png)

- Allows users to input restaurant details: title, review, cuisine, visit date, rating, and price range.
- Users can upload an image, which is stored in Cloudinary.
- **Date Picker**: Integrated with `react-datepicker` to allow users to select a visit date up to the present.
- **Rating System**: Users select a rating (1-5) by clicking on star icons.
- **Price Range Selection**: Uses dollar sign icons, similar to the rating system.

### Restaurant Page

![Restaurant Page](https://res.cloudinary.com/dnc7potxo/image/upload/v1738698510/ReadMe-Images/Dineary/Restaurant_Page.png)

- Clicking a restaurant card navigates to the detailed restaurant page.
- Includes a close icon to return to the Home Page.
- Dropdown menu with **Edit** and **Delete** options.
- **Delete Confirmation**: Alerts the user before permanently deleting an entry.
- **Edit Option**: Redirects the user to the Update Restaurant Entry Page.

### Update Restaurant Entry Page

![Update Entry Page](https://res.cloudinary.com/dnc7potxo/image/upload/v1738698545/ReadMe-Images/Dineary/Update_Entry.png)

- Pre-populated with existing restaurant data for easy editing.
- Users can modify text fields and replace the image.
- **Save Update**: Updates the entry in the database.
- **Cancel Button**: Redirects the user back to the Home Page.

### Error 404 Page

- Displays if the user navigates to a non-existing route.
- Includes a **Home** button to quickly return to the main page.

### Update Profile Page

![Profile Update Page](https://res.cloudinary.com/dnc7potxo/image/upload/v1738698477/ReadMe-Images/Dineary/Profile_Update.png)

- Accessible via the user icon in the navbar.
- Allows users to update their **name**, **last name**, and **email**.
- Future updates will expand available profile customization options.

<br>

## Technologies Used <a name="technologies"></a>

- **Frontend Framework**: React
- **Fast Build Tool**: Vite
- **CSS-in-JS for styling**: Styled-components
- **Date Selection Functionality**: React-datepicker
- **Custom Icons**: React-icons
- **Routing Management**: React-router-dom
- **Image Hosting and Management**: Cloudinary
- **Deployed on**: [Render.com](https://render.com)

<br>

## Notes <a name="notes"></a>

This project is a work in progress. Future enhancements include:

- User Authentication (Register & Login)
- Calendar and List Views for restaurant entries
- Multiple image uploads with carousel display

## Acknowledgments <a name="acknowledgments"></a>

Special thanks to:

- [Unsplash](https://unsplash.com/) for food and restaurant images used in this project.
- [React-icons](https://react-icons.github.io/react-icons/search/#q=upload) for various UI elements
- For Back End repository, follow this [Link](https://github.com/SutheeDev/PerScholasCapstoneBE)

<br>

## Feedback <a name="feedback"></a>

Feedback to improve this project is welcome. If you have any suggestions or would like to collaborate, please get in touch with me on [GitHub](https://github.com/SutheeDev). Thanks!
