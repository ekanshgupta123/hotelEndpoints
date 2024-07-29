import React, { useState } from 'react';
import '../styles/App.css';
import { useRouter } from "next/router";

const Search = () => {
    const [searchParams, setSearchParams] = useState({
        destination: '',
        checkInDate: '',
        checkOutDate: '',
        adults: 1,
        children: [{ age: '', count: 1 }],
        rooms: 1
    });
    const router = useRouter();

    const dummyHotelProperties = [
        {
            id : 1,
            title: 'Hotel Sunshine',
            price: '$100 per night',
            image: 'https://via.placeholder.com/150'
        },
        {
            id : 2,
            title: 'Grand Palace Hotel',
            price: '$150 per night',
            image: 'https://via.placeholder.com/150'
        },
        {
            id : 3,
            title: 'Oceanview Resort',
            price: '$200 per night',
            image: 'https://via.placeholder.com/150'
        }
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSearchParams(prevParams => ({
            ...prevParams,
            [name]: value
        }));
    };

    const handleChildChange = (index: number, field: string, value: any) => {
        const newChildren = searchParams.children.map((child, i) =>
            i === index ? { ...child, [field]: value } : child
        );
        setSearchParams(prevParams => ({
            ...prevParams,
            children: newChildren
        }));
    };

    const addChild = () => {
        setSearchParams(prevParams => ({
            ...prevParams,
            children: [...prevParams.children, { age: '', count: 1 }]
        }));
    };

    const deleteChild = (indexToDelete: number) => {
        setSearchParams(prevParams => ({
            ...prevParams,
            children: prevParams.children.filter((_, index) => index !== indexToDelete)
        }));
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(searchParams);
    }

    const handleViewDetails = (id: number) => {
        router.push(`/hotel/details/${id}`);
    };

    return (
        <div className="search-container">
            <h1>Check-In Search</h1>
            <button onClick={() => router.push("/reservation")}>click me</button>
            <form className="search-form" onSubmit={onSubmit}>
                <div className="form-row">
                    <input
                        className="destination-input"
                        type="text"
                        name="destination"
                        value={searchParams.destination}
                        onChange={handleInputChange}
                        placeholder="Destination"
                    />
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
                    <input
                        className="number-input"
                        type="number"
                        name="adults"
                        value={searchParams.adults}
                        onChange={handleInputChange}
                        placeholder="Number of Adults"
                    />
                    <div className="children-inputs-container">
                        {searchParams.children.map((child, index) => (
                            <div key={index} className="children-input-group">
                                <input
                                    className="number-input child-age-input"
                                    type="number"
                                    name="childAge"
                                    value={child.age}
                                    onChange={(e) => handleChildChange(index, 'age', e.target.value)}
                                    placeholder="Child Age"
                                />
                                <input
                                    className="number-input child-count-input"
                                    type="number"
                                    name="childCount"
                                    value={child.count}
                                    onChange={(e) => handleChildChange(index, 'count', e.target.value)}
                                    placeholder="Number of Children"
                                />
                                {searchParams.children.length > 1 && (
                                    <button type="button" className="delete-child-button" onClick={() => deleteChild(index)}>
                                        Delete Child
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" className="add-child-button" onClick={addChild}>Add Child</button>
                    </div>
                    <input
                        className="number-input"
                        type="number"
                        name="rooms"
                        value={searchParams.rooms}
                        onChange={handleInputChange}
                        placeholder="Number of Rooms"
                    />
                    <button type="submit" className="search-button">Search</button>
                </div>
            </form>
            <div className="properties-list">
                <h1>Available Hotels</h1>
                <ul>
                    {dummyHotelProperties.map((property, index) => (
                        <li key={index} className="property-item">
                            <h2>{property.title}</h2>
                            <p className="price">{property.price}</p>
                            {property.image && (
                                <img src={property.image} alt={property.title} className="property-image" />
                            )}
                            <br />
                            <button type="button" onClick={() => handleViewDetails(property.id)}>View Details</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default Search;