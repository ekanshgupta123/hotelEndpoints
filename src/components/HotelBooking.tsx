import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import '../styles/App.css';
import Navbar from './Navbar'
import HotelDisplay from './HotelDisplay';

import axios, { CancelTokenSource }from 'axios';
import rateLimit from 'axios-rate-limit';
import pLimit from 'p-limit';

const limit = pLimit(5);

// Create an Axios instance
const http = axios.create();


// Apply rate limiting to your Axios instance
const maxRequests = 1;
const perMilliseconds = 1000; // 5 requests per second
const maxRPS = rateLimit(http, { maxRequests, perMilliseconds });


interface Child {
    age: number;
}

interface Hotel {
    id: string; 
}

interface HotelDetails {
    id: string;
    name: string;
    address: string;
    starRating: number;
    amenities: string[];
    price: number;
    images: string[];
    description: string;
}



interface SearchParams {
    destination: string;
    checkInDate: string;
    checkOutDate: string;
    adults: number;
    rooms: number;
}

interface HotelSearchParams {
    checkin: string;
    checkout: string;
    residency: string;
    language: string;
    guests: {
        adults: number;
        children: {
            age: number;
        }[];
    }[];
    region_id: number | null;
    currency: string;
}

const Search = () => {
    const [searchParams, setSearchParams] = useState<SearchParams>({
        destination: '',
        checkInDate: '',
        checkOutDate: '',
        adults: 1,
        rooms: 1
    });

    const [hotelSearchParams, setHotelSearchParams] = useState<HotelSearchParams>({
        checkin: '',
        checkout: '',
        residency: '',
        language: '',
        guests: [{
            adults: 1,
            children: [],
        }],
        region_id: null,
        currency: ''
    });
    const cancelTokenRef = useRef<CancelTokenSource | null>(null);

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [regionId, setRegionId] = useState<number | null>(null);
    const [adults, setAdults] = useState(1);
    const [hotels, setHotels] = useState<{ id: string }[]>([]);
    const[hotelId, setHotelId] = useState<any[]>([]);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hotelDetails, setHotelDetails] = useState<HotelDetails[]>([]);
    const [children, setChildren] = useState<Child[]>([]);



    
    interface Region {
        name: string;
        id: number | null; // This should match the state's expected type
    }
    
    const handleRegionSelect = (region: Region) => {
        setRegionId(region.id); // Directly use the id from the region
    };


    const incrementAdults = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setSearchParams(prevParams => ({
            ...prevParams,
            adults: prevParams.adults + 1
        }));
    };
    
    const decrementAdults = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setSearchParams(prevParams => ({
            ...prevParams,
            adults: Math.max(1, prevParams.adults - 1)
        }));
    };
    
    const incrementChildren = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setChildren(prevChildren => [...prevChildren, { age: 2 }]);
    };
    const decrementChildren = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setChildren(prevChildren => prevChildren.slice(0, -1));
    };

  

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setSearchParams(prevParams => ({
        ...prevParams,
        [name]: name === 'adults' ? parseInt(value, 10) || 0 : value
      }));
    };
  

   const getRegionId = async (query: string) => {
        const body = JSON.stringify({
            query: query,
            lang: "en"
        });
    
        const requestOptions: RequestInit = {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: body
        };
    
        try {
            const response = await fetch("/api/search/proxy", requestOptions);
            const result = await response.json();
            console.log("Result:", result);
    
            if (result.data && result.data.regions) {
                const cities = result.data.regions.filter((region: any) => region.type === 'City');
                return cities;
            } else {
                console.log('No regions found');
                return [];
            }
        } catch (error) {
            console.log('Error:', error);
            return [];
        }
    };

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchParams.destination.length > 2) {  
                const regions = await getRegionId(searchParams.destination);
                setSuggestions(regions);
            } else {
                setSuggestions([]);
            }
        };

        fetchSuggestions();
    }, [searchParams.destination]);


    const searchHotels = async () => {
        console.log("Loading...");
        setIsLoading(true);
        setError(null);  

        if (cancelTokenRef.current) {
            cancelTokenRef.current.cancel("Canceled due to new request");
        }

        // Create a new CancelToken
        cancelTokenRef.current = axios.CancelToken.source();
    
        const guests = [{
            adults: Number(searchParams.adults),
            children: children?.map(child => ({ age: child.age })) || []
        }];

    
        const body = {
            checkin: searchParams.checkInDate,
            checkout: searchParams.checkOutDate,
            residency: "us",
            language: "en",
            guests: guests,
            region_id: regionId,
            currency: "USD"
        };
        setHotelSearchParams(body);


    
        try {
            const response = await maxRPS.post("http://localhost:3002/hotels/search", body, {
                cancelToken: cancelTokenRef.current.token
            });
            if (response.data && response.data.data && response.data.data.hotels) {
                console.log("Full response data:", response.data.data.hotels);
                // response.data.data.hotels.forEach(async (hotel: { id: string }) => {
                //     // console.log("Hotel ID:", hotel.id);
                //     await fetchHotelDetails(hotel.id);
                // });
                const hotels = response.data.data.hotels;
                for (let i = 0; i < hotels.length; i++) {
                    console.log(`Fetching details for hotel ${i + 1}/${hotels.length}: ${hotels[i].id}`);
                    await fetchHotelDetails(hotels[i].id, i, hotels[i].rates[0].daily_prices[0]);
                }      
            setHotels(response.data.data.hotels);
            } else {
                console.log("No hotels data found");
                setHotels([]);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error fetching hotels:', error.response ? error.response.data : 'Unknown error');
                setError(`Failed to fetch hotels: ${error.response ? error.response.data : 'Unknown error'}`);
            } else {
                console.error('Unexpected error:', error);
                setError('An unexpected error occurred');
            }
        } finally {
            console.log("Loading complete.");
            setIsLoading(false);
        }
    };
    

    const delay = (ms: number | undefined) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchHotelDetails = async (hotelId: any, index: number, price: number) => {
        await retryFetchHotelDetails(hotelId, index, 1, price);
    };

    const retryFetchHotelDetails = async (hotelId: any, index: number, attempt: number, price: number) => {
        try {

            await delay(index * 65 + 500 * (attempt - 1));
            console.log(`Attempting to fetch details for ${hotelId}, attempt ${attempt}`);
            
            const response = await axios.post(`http://localhost:3002/hotels/details`, {
                id: hotelId,
                language: "en"
            });

            const data = response.data.data;
            const details = {
                id: data.id,
                name: data.name,
                address: data.address,
                starRating: data.star_rating,
                amenities: data.amenity_groups.flatMap((group: { amenities: any; }) => group.amenities),
                price: price,
                images: data.images,
                description: data.description_struct.map((item: { paragraphs: any[]; }) => item.paragraphs.join(' ')).join('\n\n')
            };

            setHotelDetails(prevDetails => [...prevDetails, details]);
            console.log("Details for hotel", hotelId, details);
        } catch (error) {
            console.error(`Attempt ${attempt} failed for hotel ${hotelId}:`, error);
            if (attempt < 3) {
                console.log(`Retrying for ${hotelId}...`);
                await retryFetchHotelDetails(hotelId, index, attempt + 1, price);
            } else {
                console.error(`Failed to fetch details for hotel ${hotelId} after 3 attempts`, error);
            }
        }
    };

    const handleSuggestionClick = (region: Region) => {
        setSearchParams(prevState => ({
            ...prevState,
            destination: region.name
        }));
        setRegionId(region.id);
        console.log(region.id);
        setSuggestions([]);  
    };


    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setHotelDetails([]);
        setSearchParams({ ...searchParams });
        await searchHotels();
    };


    return (
        <div className="main-wrapper">
            <header><Navbar /></header>
            <div className="search-container">
            <form className="search-form" onSubmit={onSubmit}>
                <div className="form-row">
                    <div className="input-wrapper">
                        <input
                            className="destination-input"
                            type="text"
                            name="destination"
                            value={searchParams.destination}
                            onChange={handleInputChange}
                            placeholder="Destination"
                        />
                        {suggestions.length > 0 && (
                            <div className="suggestions-list-wrapper">
                                <ul className="suggestions-list">
                                    {suggestions.map((region) => (
                                        <li key={region.id} onClick={() => handleSuggestionClick(region)}>
                                            <div className="suggestion-text">
                                                <span className="suggestion-name">{region.name}, {region.country_code}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <input
                        className="date-input"
                        type="date"
                        name="checkInDate"
                        value={searchParams.checkInDate}
                        onChange={handleInputChange}
                    />
                    <input
                        className="date-input"
                        type="date"
                        name="checkOutDate"
                        value={searchParams.checkOutDate}
                        onChange={handleInputChange}
                    />
                <div className="input-group">
                        <span className="input-label">Adults</span>
                        <button onClick={decrementAdults} disabled={searchParams.adults <= 1}>-</button>
                        <input type="text" readOnly value={searchParams.adults} aria-label="Adults" />
                        <button onClick={incrementAdults}>+</button>
                    </div>
                    <div className="input-group">
                        <span className="input-label">Children</span>
                        <button onClick={decrementChildren} disabled={children.length <= 0}>-</button>
                        <input type="text" readOnly value={children.length} aria-label="Children" />
                        <button onClick={incrementChildren}>+</button>
                    </div>
                    <button type="submit" className="search-button">Search</button>
                </div>
            </form>
            {isLoading && <p>Loading...</p>}
            {error && <p>Error: {error}</p>}
            <div className="hotel-list-container">
            {hotelDetails.map((hotel) => (
                <HotelDisplay key={hotel.id} hotel={hotel} searchParams = {hotelSearchParams}/>
            ))}
        </div>
            </div>
        </div>
    );
    
    
}

export default Search;
