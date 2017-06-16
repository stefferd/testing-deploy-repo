function autocomplete(input, latInput, lngInput) {
    if (!input) return; // skip this function from running if there is no input on the page
    const dropdown = new google.maps.places.Autocomplete(input);

    dropdown.addListener('place_changed', () => {
       const place = dropdown.getPlace();
       latInput.value = place.geometry.location.lat();
       lngInput.value = place.geometry.location.lng();
    });

    // if someone hits enter on the address field dont submit the page
    input.on('keydown', (event) => {
        if(e.keyCode === 13) event.preventDefault();
    });
}

export default autocomplete;
