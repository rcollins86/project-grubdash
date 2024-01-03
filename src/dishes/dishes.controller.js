const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");


function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find(dish => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  });
};

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

function priceIsValid(req, res, next) {
  const { data: { price }  = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)){
        return next({
            status: 400,
            message: `Dish must have a price that is an integer greater than 0`
        });
    }
    next();
}

function idIsValidAndMatches(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  if (id && id !== dishId) {
    next({ status: 400, message: `Dish id does not match route id. Order: ${id}, Route: ${dishId}.` });
  } else {
    next()
  }
}

function list(req, res) {
  const { dishId } = req.params;
  res.json({ data: dishes.filter(
    dishId ? dish => dish.id == dishId : () => true
  )});
}

function create(req, res, next) {
  const { data: {name, description, price, image_url} = {} } = req.body
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url
  }
  dishes.push(newDish)
  res.status(201).json({ data: newDish })
}

function read(req, res, next) {
  const dish = res.locals.dish
  res.json({data: dish})
}

function update(req, res, next) {
  const dish = res.locals.dish;
  const { data: {name, description, price, image_url} = {} } = req.body;
  dish.name = name
  dish.description = description
  dish.price = price
  dish.image_url = image_url
  
  res.json({data: dish})
}

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("image_url"),
        bodyDataHas("price"),
        priceIsValid,
        create
    ],
    list,
    read: [dishExists, read],
    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("image_url"),
        priceIsValid,
        idIsValidAndMatches,
        update
    ],
};