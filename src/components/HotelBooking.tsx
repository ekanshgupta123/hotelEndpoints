import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import '../styles/App.css';
import Navbar from './Navbar';
import HotelDisplay from './HotelDisplay';
import { Alert } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import rateLimit from 'axios-rate-limit';
import pLimit from 'p-limit';

const limit = pLimit(5);
const http = axios.create();
const maxRequests = 1;
const perMilliseconds = 1000;
const maxRPS = rateLimit(http, { maxRequests, perMilliseconds });

interface QueueItem {
    hotelId: string;
    index: number;
    price: number;
    resolve: (value?: void | PromiseLike<void>) => void;
    reject: (reason?: any) => void;
}

interface Region {
    name: string;
    id: number | null; // This should match the state's expected type
}

interface Child {
    age: number;
}

interface Hotel {
    id: string;
}

interface HotelDetails {
    hotels: any;
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
    const [hotelId, setHotelId] = useState<any[]>([]);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hotelDetails, setHotelDetails] = useState<HotelDetails[]>([]);
    const [children, setChildren] = useState<Child[]>([]);

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
        const hotelIds = hotels.map(hotel => ({
            id: hotel.id,
            price: hotel.rates[0]?.daily_prices[0] || 0
        }));
        await fetchHotelDetails(hotelIds);
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

    const chunkArray = (array: any[], chunkSize: number): any[][] => {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    };

    const fetchHotelDetails = async (hotelData: { id: string, price: number }[], language: string = "en") => {
        try {
            const hotelIds = hotelData.map(hotel => hotel.id);
            const hotelIdChunks = chunkArray(hotelIds, 300);
            console.log("Hotel IDs in fetchHotelDetails: ", hotelIds);

            const guests = [{
                adults: Number(searchParams.adults),
                children: children?.map(child => ({ age: child.age })) || []
            }];

            for (const chunk of hotelIdChunks) {
                console.log("Processing chunk:", chunk);
                const response = await axios.post(`http://localhost:3002/hotels/details`, {
                    checkin: searchParams.checkInDate,
                    checkout: searchParams.checkOutDate,
                    residency: "us",
                    language: language,
                    guests: guests,
                    ids: chunk,
                    currency: "USD"
                });
                console.log("Response data:", response.data.data);

                if (Array.isArray(response.data.data)) {
                    setHotelDetails(prevDetails => [...prevDetails, ...response.data.data]);
                } else if (typeof response.data.data === 'object' && response.data.data !== null) {
                    setHotelDetails(prevDetails => [...prevDetails, response.data.data]);
                } else {
                    console.error("Unexpected response data format:", response.data.data);
                }
            }

        } 
        catch (error) {
            console.error("Error fetching hotel details:", error);
            setError("Failed to fetch hotel details.");
        } finally {
            setIsLoading(false);
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
                    {/* <h2>All Hotel IDs:</h2> */}
                    {hotelDetails.map((hotelDetail, hotelDetailIndex) => (
                        <div key={hotelDetailIndex}>
                            {hotelDetail.hotels && hotelDetail.hotels.map((hotel: { id: string; rates: { daily_prices: number[] }[] }, hotelIndex: number) => (
                                <HotelDisplay key={hotel.id || hotelIndex} hotel={{ id: hotel.id, price: hotel.rates[0].daily_prices[0] }} searchParams={hotelSearchParams}/>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Search;