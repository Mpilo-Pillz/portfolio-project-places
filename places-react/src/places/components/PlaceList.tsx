import React from "react";
import { Place } from "../../models/Place";
import Button from "../../shared/components/FormElements/Button";
import Card from "../../shared/components/UIElements/Card";
import PlaceItem from "./PlaceItem";

import "./PlaceList.css";

const PlaceList: React.FC<{ items: Place[]; onDeletePlace: () => void }> = ({
  items,
  onDeletePlace,
}) => {
  if (items.length === 0) {
    return (
      <div className="place-list center">
        <Card>
          <h2>No places found. Maybe create one?</h2>
          <Button to="/places/new">Share Place</Button>
        </Card>
      </div>
    );
  }
  return (
    <ul className="place-list">
      {items.map(
        ({ id, image, title, description, creator, address, location }) => (
          <PlaceItem
            key={id}
            id={id}
            image={image}
            title={title}
            description={description}
            address={address}
            creatorId={creator}
            coordinates={location}
            onDelete={onDeletePlace}
          />
        )
      )}
    </ul>
  );
};

export default PlaceList;
