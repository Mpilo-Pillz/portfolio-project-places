import React from "react";
import { useParams } from "react-router-dom";
import { DUMMY_PLACES } from "../../shared/mockData/dummyPlaces";
import PlaceList from "../components/PlaceList";

const UserPlaces = () => {
  const userId = useParams().userId;
  const loadedPlaces = DUMMY_PLACES.filter((place) => place.creator === userId);
  return <PlaceList items={loadedPlaces} />;
};

export default UserPlaces;
