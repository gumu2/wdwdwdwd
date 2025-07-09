// Application State
let appState = {
    currentView: 'home', // 'home', 'state', 'monument'
    currentState: null,
    currentMonument: null,
    selectedCategory: 'all',
    selectedFilter: 'all',
    searchTerm: '',
    statesData: [],
    monumentsData: []
};

// DOM Elements
const elements = {
    mainContent: document.getElementById('mainContent'),
    heroSection: document.getElementById('heroSection'),
    statesSection: document.getElementById('statesSection'),
    stateDetailSection: document.getElementById('stateDetailSection'),
    monumentDetailSection: document.getElementById('monumentDetailSection'),
    statesGrid: document.getElementById('statesGrid'),
    monumentsGrid: document.getElementById('monumentsGrid'),
    stateTitle: document.getElementById('stateTitle'),
    stateDescription: document.getElementById('stateDescription'),
    monumentInfo: document.getElementById('monumentInfo'),
    monumentLocation: document.getElementById('monumentLocation'),
    searchInput: document.getElementById('searchInput'),
    backToStates: document.getElementById('backToStates'),
    backToMonuments: document.getElementById('backToMonuments')
};

// Initialize Application
async function initApp() {
    try {
        await loadData();
        setupEventListeners();
        renderStates();
        showSection('home');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Load Data
async function loadData() {
    try {
        const [statesResponse, telanganaResponse, puducherryResponse] = await Promise.all([
            fetch('./data/states.json'),
            fetch('./data/telangana.json'),
            fetch('./data/puducherry.json')
        ]);
        
        appState.statesData = await statesResponse.json();
        const telanganaMonuments = await telanganaResponse.json();
        const puducherryMonuments = await puducherryResponse.json();
        
        // Combine all monument data
        appState.monumentsData = [
            ...telanganaMonuments,
            ...puducherryMonuments
        ];
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to sample data if files don't exist
        appState.statesData = getSampleStatesData();
        appState.monumentsData = getSampleMonumentsData();
    }
}

// Event Listeners
function setupEventListeners() {
    // Navigation category buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            appState.selectedCategory = e.target.dataset.category;
            if (appState.currentView === 'state') {
                filterMonuments();
            }
        });
    });

    // Filter buttons in state detail
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            appState.selectedFilter = e.target.dataset.filter;
            filterMonuments();
        });
    });

    // Search input
    elements.searchInput.addEventListener('input', debounce((e) => {
        appState.searchTerm = e.target.value.toLowerCase();
        if (appState.currentView === 'state') {
            filterMonuments();
        }
    }, 300));

    // Back buttons
    elements.backToStates.addEventListener('click', () => showSection('home'));
    elements.backToMonuments.addEventListener('click', () => showSection('state'));
}

// Show Section
function showSection(section) {
    // Hide all sections
    elements.heroSection.classList.add('hidden');
    elements.statesSection.classList.add('hidden');
    elements.stateDetailSection.classList.add('hidden');
    elements.monumentDetailSection.classList.add('hidden');

    // Show appropriate section
    switch (section) {
        case 'home':
            elements.heroSection.classList.remove('hidden');
            elements.statesSection.classList.remove('hidden');
            appState.currentView = 'home';
            break;
        case 'state':
            elements.stateDetailSection.classList.remove('hidden');
            appState.currentView = 'state';
            break;
        case 'monument':
            elements.monumentDetailSection.classList.remove('hidden');
            appState.currentView = 'monument';
            break;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render States
function renderStates() {
    console.log('States data:', appState.statesData); // Add this line
    elements.statesGrid.innerHTML = '';
    appState.statesData.forEach((state, index) => {
        const stateCard = createStateCard(state, index);
        elements.statesGrid.appendChild(stateCard);
    });
}

// Create State Card
function createStateCard(state, index) {
    const card = document.createElement('div');
    card.className = 'state-card fade-in';
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
        <div class="state-card-image" style="background-image: url('${state.image}')">
            <div class="state-card-content">
                <h3>${state.name}</h3>
                <p>${state.monumentCount || 0} Heritage Sites</p>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => showStateDetail(state));
    
    return card;
}

// Show State Detail
function showStateDetail(state) {
    appState.currentState = state;
    elements.stateTitle.textContent = state.name;
    elements.stateDescription.textContent = state.description;
    
    renderMonuments();
    showSection('state');
}

// Render Monuments
function renderMonuments() {
    if (!appState.currentState) return;
    
    const stateMonuments = appState.monumentsData.filter(
        monument => monument.state === appState.currentState.id
    );
    
    appState.currentStateMonuments = stateMonuments;
    filterMonuments();
}

// Filter Monuments
function filterMonuments() {
    if (!appState.currentStateMonuments) return;
    
    let filteredMonuments = appState.currentStateMonuments;
    
    // Filter by category
    if (appState.selectedFilter !== 'all') {
        filteredMonuments = filteredMonuments.filter(
            monument => monument.type.toLowerCase() === appState.selectedFilter
        );
    }
    
    // Filter by search term
    if (appState.searchTerm) {
        filteredMonuments = filteredMonuments.filter(monument =>
            monument.name.toLowerCase().includes(appState.searchTerm) ||
            monument.location.toLowerCase().includes(appState.searchTerm) ||
            monument.description.toLowerCase().includes(appState.searchTerm)
        );
    }
    
    displayMonuments(filteredMonuments);
}

// Display Monuments
function displayMonuments(monuments) {
    elements.monumentsGrid.innerHTML = '';
    
    if (monuments.length === 0) {
        elements.monumentsGrid.innerHTML = `
            <div class="no-results">
                <p>No monuments found matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    monuments.forEach((monument, index) => {
        const monumentCard = createMonumentCard(monument, index);
        elements.monumentsGrid.appendChild(monumentCard);
    });
}

// Create Monument Card
function createMonumentCard(monument, index) {
    const card = document.createElement('div');
    card.className = 'monument-card fade-in';
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
        <div class="monument-card-image" style="background-image: url('${monument.image}')"></div>
        <div class="monument-card-content">
            <h4>${monument.name}</h4>
            <span class="monument-type">${monument.type}</span>
            <div class="monument-location">${monument.location}</div>
            <p>${monument.description}</p>
        </div>
    `;
    
    card.addEventListener('click', () => showMonumentDetail(monument));
    
    return card;
}

// Show Monument Detail
function showMonumentDetail(monument) {
    appState.currentMonument = monument;
    
    // Render monument information according to the specified layout template
    elements.monumentInfo.innerHTML = `
        <div class="monument-template">
            <div class="template-header">
                <h2 class="template-title">SANSKRITIC DHAROHAR</h2>
            </div>
            <div class="template-image-section">
                <div class="template-image-placeholder">Picture</div>
            </div>
            <div class="template-three-columns">
                <div class="template-column">
                    <h3 class="template-column-title">NAME OF THE MONUMENTS</h3>
                    <ul class="template-list">
                        <li>Main Prasad: ${monument.mainPrasad || 'Not specified'}</li>
                        <li>Open timings: ${monument.timings || 'Open daily: 6:00 AM - 8:00 PM'}</li>
                        <li>Prayers Timing: ${monument.prayersTiming || 'Not specified'}</li>
                        <li>Other deities: ${monument.otherDeities || 'Not specified'}</li>
                        <li>Amenities: ${monument.amenities || 'Not specified'}</li>
                        <li>Drinking Water: ${monument.drinkingWater || 'Available'}</li>
                        <li>Pooja Items Shops: ${monument.poojaItemsShops || 'Available nearby'}</li>
                        <li>Restrooms: ${monument.restrooms || 'Available'}</li>
                        <li>Festival: ${monument.festivals || 'Various religious festivals celebrated'}</li>
                        <li>Marriage (if being happen): ${monument.marriage || 'Not specified'}</li>
                        <li>Education (if provided): ${monument.education || 'Not specified'}</li>
                        <li>Daan Dakshina: ${monument.daanDakshina || 'Accepted'}</li>
                        <li>Flowers (Jo chadhaya jata hai): ${monument.flowers || 'Not specified'}</li>
                        <li>Food available for people (like langar): ${monument.foodAvailable || 'Not specified'}</li>
                        <li>Videos clips & links: ${monument.videoLinks || 'Not available'}</li>
                    </ul>
                </div>
                <div class="template-column">
                    <strong><em class="template-main-content">MAIN CONTENT</em></strong>
                    <p class="template-description">${monument.description}</p>
                </div>
                <div class="template-column">
                    <h3 class="template-column-title">Location</h3>
                    <ul class="template-list">
                        <li>Google maps: ${monument.googleMaps || 'Interactive Map (Google Maps Integration)'}</li>
                        <li>Weather Details (like which month has which season): ${monument.weatherDetails || 'October to March pleasant'}</li>
                        <li>Sea level: ${monument.seaLevel || 'Not specified'}</li>
                        <li>How to reach:</li>
                        <li>Nearest Bus Station: ${monument.nearestBusStation || 'Not specified'}</li>
                        <li>Nearest Railway Station: ${monument.nearestRailwayStation || 'Not specified'}</li>
                        <li>Nearest Airport: ${monument.nearestAirport || 'Not specified'}</li>
                        <li>Nearby Restaurants: ${monument.nearbyRestaurants || 'Available nearby'}</li>
                        <li>Nearby Hotels (Top 5 best & top 5 cheap): ${(monument.nearbyHotels || ['Hotel Heritage Inn', 'Royal Palace Hotel', 'Budget Stay Lodge']).join(', ')}</li>
                        <li>Nearby Non-religious or Religious Places to go for: ${monument.nearbyPlaces || 'Not specified'}</li>
                        <li>Famous food that can be tasted: ${monument.famousFood || 'Local cuisine available'}</li>
                        <li>Contact details of the monument: ${monument.contactDetails || 'Not specified'}</li>
                        <li>Website of the monument (if any): ${monument.website || 'Not available'}</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    // Clear monumentLocation as it's now included in the three-column layout
    elements.monumentLocation.innerHTML = '';
    
    showSection('monument');
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Sample Data (fallback)
function getSampleStatesData() {
    return [
        {
            id: 'telangana',
            name: 'Telangana',
            image: '/telangana.jpeg/what-is-telangana-famous-for.jpg',
            description: 'Telangana showcases a rich blend of Islamic and Hindu architecture through its historic monuments, temples, and palaces.',
            monumentCount: 12
        },
        {
            id: 'puducherry',
            name: 'Puducherry',
            image: '/bd8f6ee5607298645984876c0e86192.jpg',
            description: 'The former French colony showcases beautiful colonial architecture, ancient temples, and churches.',
            monumentCount: 15
        }
    ];
}

function getSampleMonumentsData() {
    return [
        {
            id: 'birla-mandir-hyderabad',
            name: 'Birla Mandir',
            state: 'telangana',
            type: 'temple',
            location: 'Naubat Pahad, Hyderabad',
            image: 'https://i.pinimg.com/736x/45/67/89/456789abc123def456789012345678901.jpg',
            description: 'Constructed in white marble with panoramic city views. Non-sectarian temple open to all faiths.',
            timings: '7:00 AM – 12:00 PM, 3:00 PM – 9:00 PM',
            entryFee: 'Free',
            bestTime: 'October to March',
            facilities: ['Parking', 'Panoramic Views', 'Tourist Information'],
            address: 'Naubat Pahad, Hyderabad, Telangana',
            howToReach: 'Rajiv Gandhi International Airport is 35 km away. Well connected by road and metro.',
            nearbyHotels: ['Taj Krishna', 'ITC Kakatiya', 'Marriott Hyderabad'],
            festivals: 'Vaikunta Ekadasi, Brahmotsavam, Janmashtami',
            photography: 'Photography allowed'
        },
        {
            id: 'manakula-vinayagar-temple',
            name: 'Manakula Vinayagar Temple',
            state: 'puducherry',
            type: 'temple',
            location: 'Manakula Vinayagar Koil St, White Town, Puducherry',
            image: 'https://i.pinimg.com/736x/7e/fc/95/7efc953cfc099fab170d520436c20c7b.jpg',
            description: 'A very famous and ancient temple dedicated to Lord Ganesha, located in the heart of Puducherry\'s French Quarter.',
            timings: 'Morning: 5:30 AM to 12:30 PM, Evening: 4:00 PM to 9:00 PM',
            entryFee: 'Free',
            bestTime: 'October to March',
            facilities: ['Elephant Lakshmi blessings', 'Cultural events', 'Tourist information'],
            address: 'Manakula Vinayagar Koil St, White Town, Puducherry',
            howToReach: 'Puducherry Airport is 7 km away. Well connected by road and rail.',
            nearbyHotels: ['Hotel Atithi', 'The Promenade', 'Villa Shanti'],
            festivals: 'Ganesh Chaturthi, Vinayaka Chaturthi, Brahmotsavam',
            photography: 'Photography allowed'
        }
    ];
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);