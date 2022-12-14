import fs from "fs";

import { Request, Response, NextFunction } from "express";

import mongoose from "mongoose";
import { validationResult } from "express-validator";

import { getCoordsForAddress } from "../../util/location";
import HttpError from "../models/http-error";
import { PlaceType } from "../types/place";
import User from "../models/user";
import Place from "../models/place";
import { CheckAuthRequest } from "../types/user";

export let DUMMY_PLACES: PlaceType[] = [
  {
    id: "p1",
    title: "Mbabane",
    description: "One of the places I grew up",
    address: "Dr Sishayi, Mbabane, Eswatini",
    location: {
      lat: -26.3152423,
      lng: 31.1196755,
    },
    creator: "u1",
    imageUrl:
      "https://images.unsplash.com/photo-1655207882298-bd11bb69ee43?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTF8fGVzd2F0aW5pfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "p2",
    title: "Mlilwane",
    description: "My first Cycle Trail",
    address: "Lobamba, Eswatini",
    location: {
      lat: -26.4798342,
      lng: 31.1938053,
    },
    creator: "u2",
    imageUrl:
      "https://images.unsplash.com/photo-1652478412734-22ff7ad45dee?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTJ8fGVzd2F0aW5pfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60",
  },
];

export const getPlaceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    console.log(err);

    const error = new HttpError(
      "Something went wrong, could not find a place",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      "Could not find a place for the provided id.",
      404
    );
    return next(error);
  }
  /**
   * removing _id and making place an object
   * mongoose adds and id getter to every document which returns the id as a string
   * the getters are lost when we add toObject so setting getters to true retains the getters so they are kept and not lost
   * */

  res.json({ place: place.toObject({ getters: true }) });
};

export const getPlacesByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.params.uid;

  // let places: PlaceType[];
  //  TODO Type correctly
  let userWithPlaces: any;

  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed, please try again later",
      500
    );
    return next(error);
  }

  // if (!places || places.length === 0)
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError("Could not find  places for the provided user id.", 404)
    );
  }

  res.json({
    places: userWithPlaces.places.map((place: any) =>
      place.toObject({ getters: true })
    ),
  });
};

export const createPlace = async (
  req: CheckAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    res.status(422).json({ message: errors });

    next(new HttpError("Invalid inputs passed, please check your data.", 422));
  }
  const { title, description, address, creator }: PlaceType = req.body;

  let coordinates;

  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file?.path.replace(
      "/Users/mpilopillz/Dla-Mini-Dev/myProjects/portfolioProjects/portfolio-project-places/places-express/dist/src/",
      ""
    ),
    creator: req?.userData?.userId,
  });

  let user;

  try {
    user = await User.findById(req?.userData?.userId);
  } catch (err) {
    const error = new HttpError("Creating place failed", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    // TODO - fix typing
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);

    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

export const updatePlace = async (
  req: CheckAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    res.status(422).json({ message: errors });

    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description }: PlaceType = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong could not update place.",
      500
    );
    return next(error);
  }

  /**
   * Add to String cos the crator id comes form monguse as a different type
   */
  if (place?.creator.toString() !== req?.userData?.userId) {
    const error = new HttpError("You are not allowed to edit this place.", 401);
    return next(error);
  }
  if (place) {
    place.title = title;
    place.description = description;
  }

  try {
    await place?.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place?.toObject({ getters: true }) });
};

export const deletePlace = async (
  req: CheckAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find place for this id.", 404);
    return next(error);
  }

  if (place.creator.id !== req?.userData?.userId) {
    const error = new HttpError(
      "You are not allowed to delete this place.",
      401
    );
    return next(error);
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place?.remove({ session: sess });
    await place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted place" });
};
