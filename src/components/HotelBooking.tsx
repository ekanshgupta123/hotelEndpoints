import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import '../styles/App.css';
import Navbar from './Navbar'
import HotelDisplay from './HotelDisplay';
import { Alert } from '@mui/material';

import axios, { CancelTokenSource }from 'axios';
import rateLimit from 'axios-rate-limit';
import pLimit from 'p-limit';

const limit = pLimit(5);

// Create an Axios instance
const http = axios.create();

interface QueueItem {
    hotelId: string;
    index: number;
    price: number;
    resolve: (value?: void | PromiseLike<void>) => void;
    reject: (reason?: any) => void;
}


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
    main_name: string;
    room_images: string[];
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
    
        // Cancel previous requests
        if (cancelTokenRef.current) {
            cancelTokenRef.current.cancel("Canceled due to new request");
        }
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
            console.log(body);
            const response = await axios.post("http://localhost:3002/hotels/search", body, {
                cancelToken: cancelTokenRef.current.token
            });
            console.log("Response: ", response);
            if (response.data && response.data.data && response.data.data.hotels) {
                console.log("Full response data:", response.data.data.hotels);
                const hotels = response.data.data.hotels;
                console.log("Total hotels found: ", hotels.length);
                await processHotels(hotels);
                setHotels(hotels);
            } else {
                console.log("No hotels data found");
                setHotels([]);
            }
        } catch (error) {
            handleErrors(error);
        } finally {
            setIsLoading(false);
            console.log("Loading complete.");
        }
    };
    
    const processHotels = async (hotels: any[]) => {
        const hotelDetailsPromises = hotels.map((hotel, index) =>
            fetchHotelDetails(hotel.id, hotel.rates[0].daily_prices[0])
        );
        await Promise.all(hotelDetailsPromises);
    };
    
    const handleErrors = (error: unknown) => {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
        } else if (error.response) {
            console.error('Error fetching hotels:', error.response.data);
            setError(`Failed to fetch hotels: ${error.response.data.message}`);
        } else {
            console.error('Unexpected error:', error);
            setError('An unexpected error occurred');
        }
    };

    // const searchHotels = async () => {
    //     console.log("Loading...");
    //     setIsLoading(true);
    //     setError(null);  

    //     if (cancelTokenRef.current) {
    //         cancelTokenRef.current.cancel("Canceled due to new request");
    //     }

    //     cancelTokenRef.current = axios.CancelToken.source();
    
    //     const guests = [{
    //         adults: Number(searchParams.adults),
    //         children: children?.map(child => ({ age: child.age })) || []
    //     }];

    
    //     const body = {
    //         checkin: searchParams.checkInDate,
    //         checkout: searchParams.checkOutDate,
    //         residency: "us",
    //         language: "en",
    //         guests: guests,
    //         region_id: regionId,
    //         currency: "USD"
    //     };
    //     setHotelSearchParams(body);

    //     const MAX_CONCURRENT_REQUESTS = 5;
    //     const requestQueue: QueueItem[] = [];
    //     let activeRequests = 0;

    //     const processQueue = async () => {
    //         if (requestQueue.length === 0 || activeRequests >= MAX_CONCURRENT_REQUESTS) {
    //             return;
    //         }

    //         activeRequests++;
    //         const request = requestQueue.shift();
    //         if (!request) {
    //             activeRequests--;
    //             return;
    //         }

    //         const { hotelId, index, price, resolve, reject } = request;

    //         try {
    //             await fetchHotelDetails(hotelId, price);
    //             resolve();
    //         } catch (error) {
    //             reject(error);
    //         } finally {
    //             activeRequests--;
    //             processQueue(); 
    //         }
    //     };

    //     const queueRequest = (hotelId: any, index: any, price: any) => {
    //         return new Promise((resolve, reject) => {
    //             requestQueue.push({ hotelId, index, price, resolve, reject });
    //             processQueue();
    //         });
    //     };
    
    //     try {
    //         console.log(body);
    //         const response = await maxRPS.post("http://localhost:3002/hotels/search", body, {
    //             cancelToken: cancelTokenRef.current.token
    //         });
    //         console.log("Response: ", response);
    //         if (response.data && response.data.data && response.data.data.hotels) {
    //             console.log("Full response data:", response.data.data.hotels);
        
    //             const hotels = response.data.data.hotels;
        
    //             const hotelDetailsPromises = hotels.map((hotel: { id: any; rates: { daily_prices: any[]; }[]; }, index: any) =>
    //                 queueRequest(hotel.id, index, hotel.rates[0].daily_prices[0])
    //             );
        
    //             await Promise.all(hotelDetailsPromises);
    //             setHotels(response.data.data.hotels);
    //         } else {
    //             console.log("No hotels data found");
    //             setHotels([]);
    //         }
    //     } catch (error) {
    //         if (axios.isAxiosError(error)) {
    //             console.error('Error fetching hotels:', error);
    //             const errorMessage = error.response ? error.response.data : error.message;
    //             setError(`Failed to fetch hotels: ${errorMessage}`);
    //         } else {
    //             console.error('Unexpected error:', error);
    //             setError('An unexpected error occurred');
    //         }
    //     } finally {
    //         console.log("Loading complete.");
    //         setIsLoading(false);
    //     }
    //     };
        
        
        // const delay = (ms: number | undefined) => new Promise(resolve => setTimeout(resolve, ms));
        
        // const fetchHotelDetails = async (hotelId: any, index: any, price: any) => {
        //     await retryFetchHotelDetails(hotelId, index, 1, price);
        // };

        const fetchHotelDetails = async (hotelId: string, price: number) => {
            try {
                const response = await axios.post(`http://localhost:3002/hotels/details`, {
                    id: hotelId,
                    language: "en"
                });
                const data = response.data.data; 
        
                console.log(data.room_groups);

                const details = {
                    id: data.id,
                    name: data.name,
                    address: data.address,
                    starRating: data.star_rating,
                    amenities: data.amenity_groups.flatMap((group: { amenities: any; }) => group.amenities),
                    price: price, 
                    images: data.images,
                    description: data.description_struct.map((item: { paragraphs: any[]; }) => item.paragraphs.join(' ')).join('\n\n'),
                    main_name: data.room_groups.map((group: { name_struct: { main_name: any; }; }) => group.name_struct.main_name),
                    room_images: data.room_groups.map((group: { images: string | any[]; }) => group.images.length > 0 ? group.images[0].replace('{size}', '240x240') : null)
                };
        
                console.log("Details: ", details);
        
                setHotelDetails(prevDetails => [...prevDetails, details]);
        
                console.log("Details for hotel", hotelId, details);
            } catch (error) {
                console.error('Failed to fetch hotel details:', error);
            }
        };       
        
        
        // const retryFetchHotelDetails = async (hotelId: any, index: number, attempt: number, price: any) => {
        //     try {
        //         await delay(index * 65 + 500 * (attempt - 1));
        //         console.log(`Attempting to fetch details for ${hotelId}, attempt ${attempt}`);
                
        //         const response = await axios.post(`http://localhost:3002/hotels/details`, {
        //             id: hotelId,
        //             language: "en"
        //         });
        
        //         const data = response.data.data;
        //         console.log(data.room_groups);
        //         const details = {
        //             id: data.id,
        //             name: data.name,
        //             address: data.address,
        //             starRating: data.star_rating,
        //             amenities: data.amenity_groups.flatMap((group: { amenities: any; }) => group.amenities),
        //             price: price,
        //             images: data.images,
        //             description: data.description_struct.map((item: { paragraphs: any[]; }) => item.paragraphs.join(' ')).join('\n\n'),
        //             main_name: data.room_groups.map((group: { name_struct: { main_name: any; }; }) => group.name_struct.main_name),
        //             room_images: data.room_groups.map((group: { images: string | any[]; }) => group.images.length > 0 ? group.images[0].replace('{size}', '240x240') : null)
        //         };
        //         console.log("Details: ", details);
        
        //         setHotelDetails(prevDetails => [...prevDetails, details]);
        //         console.log("Details for hotel", hotelId, details);
        //     } catch (error) {
        //         console.error(`Attempt ${attempt} failed for hotel ${hotelId}:`, error);
        //         if (attempt < 3) {
        //             console.log(`Retrying for ${hotelId}...`);
        //             await retryFetchHotelDetails(hotelId, index, attempt + 1, price);
        //         } else {
        //             console.error(`Failed to fetch details for hotel ${hotelId} after 3 attempts`, error);
        //         }
        //     }
        // };
        

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
        if (!searchParams.destination || !searchParams.checkInDate || !searchParams.checkOutDate) {
            setError("Please fill in all required fields.");
            return;
        }    
        setHotelDetails([]);
        setSearchParams({ ...searchParams });
        await searchHotels();
    };
    const today = new Date().toISOString().split('T')[0];
    const minCheckOutDate = searchParams.checkInDate ? new Date(new Date(searchParams.checkInDate).getTime() + 86400000).toISOString().split('T')[0] : today;


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
                        min={today}
                    />
                    <input
                        className="date-input"
                        type="date"
                        name="checkOutDate"
                        value={searchParams.checkOutDate}
                        onChange={handleInputChange}
                        min={minCheckOutDate}
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
                    <button type="submit" className="search-button" disabled={isLoading}> Search </button>
                </div>
            </form>
            {isLoading && <p>Loading...</p>}
            {error && (
                <Alert severity="error">
                    Error: {error}
                </Alert>
            )}
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
