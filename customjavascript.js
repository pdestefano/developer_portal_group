/*
 * Custom EBSCO project menu
 */

// text:    Display text for the menu
// url:     Link to navigate to, and for simple matching
// match:   RegEx for alternative matching
const ebscoCustomMenuData = [
    { text: "Getting Started", url: "/home/docs", match: "^\/home\/discuss" },
    { text: "Search & Discovery", url: "/home/page/search-discovery", children: [
        { text: "EDS API", url: "/eds-api/docs", match: "^\/eds-api\/" },
        { text: "Entitlement API", url: "/search-discovery-apis/entitlement-api", match: "^\/entitlement-api\/" },
        { text: "BiblioGraph API", url: "/bibliograph/docs", match: "^\/bibliograph\/" }
    ]},
    { text: "Knowledge Services", url: "/home/page/knowledge-services", match: "^\/knowledge-services\/(reference|changelog)", children: [
        { text: "Holdings IQ", url: "/knowledge-services/docs/holdingsiq-overview", match: "^\/knowledge-services\/docs\/holdingsiq" },
        { text: "Publication IQ", url: "/knowledge-services/docs/publicationiq-overview", match: "^\/knowledge-services\/docs\/publicationiq" },
        { text: "Link IQ", url: "/knowledge-services/docs/linkiq-overview", match: "^\/knowledge-services\/docs\/linkiq" }
    ] },
    { text: "Medical Point of Care", url: "/home/page/medical-point-of-care", children: [
        { text: "Dynamed", url: "/medical-point-care-apis/dynamed" }, //url: "/dynamed/docs", match: "^\/dynamed\/" },
        { text: "Dynamic Health", url: "/medical-point-care-apis/dynamic-health" }, //url: "/dynamic-health/docs", match: "^\/dynamic-health\/" },
        { text: "Dynamed Decisions", url: "/medical-point-care-apis/dynamed-decisions" }, // url: "/dynamed-decisions/docs", match: "^\/dynamed-decisions\/" },
        { text: "Consumer Health", url: "/medical-point-care-apis/consumer-health" }, // url: "/consumer-health/docs", match: "^\/consumer-health\/" }
        { text: "EBSCO Partner", url: "/medical-point-care-apis/dynamic-health-partner" }, 
        { text: "NAH Reference Center", url: "/medical-point-care-apis/nah-reference-center" } // url: "/nah-reference-center/docs", match: "^\/nah-reference-center\/" }
    ]}
];

function isActive(item) {
    return location.pathname.includes(item.url) || (item.match && location.pathname.match(item.match));
}

function createProjectMenu(items) {
    // Main elements of the menu
    const dropdown = document.createElement('div');
    const dropdownButton = document.createElement('button');
    const dropdownList = document.createElement('ul');

    // Function to create an <li> with an <a> and text given a menu item
    const createListItem = (item) => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        if (isActive(item)) {
            listItem.classList.add('active');
        }
        link.setAttribute('href', item.url);
        link.textContent = item.text;
        listItem.appendChild(link);
        return listItem;
    }

    // Create list items and links for each item
    items.forEach( (item) => {
        dropdownList.appendChild(createListItem(item));
        if (item.children) {
            const subList = document.createElement('ul');
            item.children.forEach(child => subList.appendChild(createListItem(child)));
            dropdownList.appendChild(subList);
        }
    });

    dropdown.classList.add('EBSCO-project-menu');
    dropdownButton.textContent = 'Explore our APIs ▾';
    dropdown.appendChild(dropdownButton);
    dropdown.appendChild(dropdownList);

    // Insert the menu at the beginning of the bottom header nav and remove the ReadMe menu when present
    const headerBottomNav = document.querySelector('.rm-Header-bottom nav');
    const readMeProjectMenu = headerBottomNav.querySelector('div.Dropdown');
    headerBottomNav.insertBefore(dropdown, headerBottomNav.firstChild);
    if (readMeProjectMenu) {
        readMeProjectMenu.remove();
    }

    // Add event listeners to toggle the visibility of the dropdown menu
    dropdownButton.addEventListener('click', () => {
        dropdownList.classList.toggle('open');
    });
    dropdownButton.addEventListener('blur', () => {
        setTimeout( () => {
            dropdownList.classList.remove('open');
        },150);
    }, { passive: true });
}

function setActiveProject(items) {
    items.forEach(item => {
        // Find the active element among this parent and any children, checking the children first. Update the menu button to match.
        const activeElement = [...item.children || [], item].find(isActive);
        if (activeElement) {
             if(document.querySelector('.EBSCO-project-menu button'))
               {         
                  document.querySelector('.EBSCO-project-menu button').textContent = activeElement.text + ' ▾';
                  // document.querySelector('.EBSCO-project-menu a[href=' + activeElement.url + '"]').parentElement.classList.add("active");
               }
        }
        // Update active state on the header links accordingly
        const groupLink = document.querySelector('header a[href="'+ item.url + '"]');
        if (groupLink) {
            activeElement ? groupLink.classList.add('active') : groupLink.classList.remove('active');
        }
    });
}

function removeGuidesLink() {
    let guidesLink = document.querySelector(".rm-Header-bottom a.rm-Header-link[href='/home/docs']");
    if (guidesLink) {
        guidesLink.remove();
    }
}

// Update the menu and header on page events
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        removeGuidesLink();
        createProjectMenu(ebscoCustomMenuData);
        setActiveProject(ebscoCustomMenuData);
        $(window).on('pageLoad', () => {
            setActiveProject(ebscoCustomMenuData);
        });
    }, 1000);
});



/*
 * Custom JS to maintain EDS API auth and session tokens in the API Reference
 */

// Intercept ReadMe's API requests
const { fetch: originalFetch } = window;
window.fetch = async (...args) => {
    let [resource, config] = args;
    const response = await originalFetch(resource, config);

    // Extract auth token when the EDS API auth endpoint was called
    if (resource && resource.includes('authservice/rest/uidauth')) {
        response.clone().json().then((data) => {
            if (data && data.AuthToken) {
                //console.log('Got an auth token! ', data.AuthToken);
                window.localStorage.setItem('edsapi-auth', data.AuthToken)
            }
        });
    }
    // Extract session token when the EDS API session endpoint was called
    if (resource && resource.includes('edsapi/rest/createsession')) {
        response.clone().json().then((data) => {
            if (data && data.SessionToken) {
                //console.log('Got a session token! ', data.SessionToken);
                window.localStorage.setItem('edsapi-session', data.SessionToken)
            }
        });
    }
    return response;
};

// Wrapper to update one or more ReadMe inputs in the UI
function updateReadMeInputs(inputs, values){
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;  
    for (let i = 0; i < inputs.length; i++) {
        nativeInputValueSetter.call(inputs[i], values[i]);
        inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
    };
}

// Check for stored EDS API tokens and populate form when they are present
function populateEdsApiTokens() {
    let inputs = [];
    let values = [];

    const authInput = document.querySelector("input[id$='x-authenticationToken']");
    const authToken = localStorage.getItem('edsapi-auth');
    if (authInput && authToken) {
        inputs.push(authInput);
        values.push(authToken);
    }
    const sessionInput = document.querySelector("input[id$='x-sessionToken']");
    const sessionToken = localStorage.getItem('edsapi-session');
    if (sessionInput && sessionToken) {
        inputs.push(sessionInput);
        values.push(sessionToken);
    }
    if (inputs.length > 0) {
        //console.log('Populate tokens!');
        updateReadMeInputs(inputs, values);
    }
}

// Populate EDS API auth and session tokens in the API Reference input fields
document.addEventListener("DOMContentLoaded", function () {
    $(window).on('pageLoad', function(e, state) {
        if (location.pathname.includes('/eds-api/reference/')) {
            setTimeout(populateEdsApiTokens, 1000);
        }
    })
});