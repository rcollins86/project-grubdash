const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId)
  if (foundOrder) {
    res.locals.order = foundOrder
    return next()
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function dishesIsArray(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (Array.isArray(dishes) && dishes.length) {
    next()
  } else {
    next({ status: 400, message: `Order must include at least one dish.` });
  }
}

function quantityIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  for (let index=0; index < dishes.length; index++) {
    if (!dishes[index].quantity || dishes[index].quantity <= 0 || !Number.isInteger(dishes[index].quantity)){
        next({
            status: 400,
            message: 
              `Dish ${index} must have a quantity that is an integer greater than 0`
        });
    }
  }
  next()
}

function statusNotDelivered(req, res, next) {
  const { data: { status }} = req.body;
  if (status === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed"
    })
  }
  next();
}

function statusIsValid(req, res, next) {
  const { data: { status }} = req.body;
  if (!["pending", "preparing", "out-for-delivery", "delivered"].includes(status)) {
    next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    })
  }
  next();
}

function statusIsPending(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending."
    })
  }
  next();
}

function idIsValidAndMatches(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } } = req.body;
  if (id && id !== orderId) {
    next({ status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.` });
  } else {
    next()
  }
}

function list(req, res, next) {
  const { orderId } = req.params;
  res.json({ data: orders.filter(
    orderId ? order => order.id == orderId : () => true
  )});
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: "pending",
    dishes
  }
  orders.push(newOrder)
  res.status(201).json({ data: newOrder })
}

function read(req, res, next) {
  const order = res.locals.order;
  res.json({ data: order });
}

function update(req, res, next) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;
  order.deliverTo = deliverTo
  order.mobileNumber = mobileNumber
  order.dishes = dishes
  order.status = status
  
  res.json({data: order})
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === Number(orderId));
  const deletedOrder = orders.splice(index, 1);
  res.sendStatus(204);
}


module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesIsArray,
    quantityIsValid,
    create
  ],
  read: [
    orderExists,
    read
  ],
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("status"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesIsArray,
    quantityIsValid,
    statusNotDelivered,
    statusIsValid,
    idIsValidAndMatches,
    update
  ],
  delete: [
    orderExists,
    statusIsPending,
    destroy
  ]
}