function createStar() {
    const header = document.querySelector('.gblog-header');
    const star = document.createElement('div');
    star.classList.add('star');

    //Get the height of the header dynamically
    const headerHeight = header.offsetHeight;
    
    // Randomize the initial position of the star
    star.style.left = `${Math.random() * 100}vw`;
    star.style.top = `${Math.random() * headerHeight}px`;

    document.querySelector('.star-container').appendChild(star);

  
    // Check the star's position at frequent intervals (e.g., every 50ms)
    const checkInterval = setInterval(() => {
	const starPosition = star.getBoundingClientRect();
	
        // Remove the star if it exceeds the bottom boundary of the header
       if (starPosition.top > headerHeight) {
         star.remove();
         clearInterval(checkInterval);  // Stop checking once the star is removed
       }
	
    }, 50);  // Check every 50ms for smooth animation
        
    // Remove the star after the animation completes
    setTimeout(() => {
        star.remove();
	clearInterval(checkInterval);
    }, 2000);
}

// Continuously create stars
setInterval(createStar, 500);
