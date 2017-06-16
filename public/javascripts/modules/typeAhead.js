import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHtml(stores) {
    return stores.map(store => {
       return `<a href="/store/${store.slug}" class="search__result">
                <strong>${store.name}</strong>
            </a>`;
    }).join('');
}

function typeAhead(search) {
    if (!search) return;

    const searchInput = search.querySelector('input[name="search"]');
    const searchResults = search.querySelector('.search__results');

    searchInput.on('input', function() {
       if (!this.value) { // if there is no value, quit it
           searchResults.style.display = 'none';
           return;
       }

       searchResults.style.display = 'block';
       axios.get(`/api/v1/search?q=${this.value}`).then(response => {
          if (response.data.length) {
            searchResults.innerHTML = dompurify.sanitize(searchResultsHtml(response.data));
            return;
          }
          searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results for ${this.value} found!</div>`);
       }).catch(error => {
           console.error(error);
       });
    });

    // handle keyboard inputs
    searchInput.on('keyup', (event) => {
       if (![38, 40, 13].includes(event.keyCode)) {
           return; // skip it
       }
       const activeClass = 'search__result--active';
       const current = search.querySelector(`.${activeClass}`);
       const items = search.querySelectorAll('.search__result');
       let next;

       if (event.keyCode === 40 && current) {
           next = current.nextElementSibling || items[0];
       } else if (event.keyCode === 40) {
           next = items[0];
       } else if (event.keyCode === 38 && current) {
           next = current.previousElementSibling || items[items.length - 1];
       } else if (event.keyCode === 38) {
           next = items[items.length - 1];
       } else if (event.keyCode === 13 && current.href) {
           window.location = current.href;
           return;
       }

       if (next) {
           if (current) {
               current.classList.remove(activeClass);
           }
           next.classList.add(activeClass);
       }
    });
}

export default typeAhead;
