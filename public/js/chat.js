const socket = io();

const $messageForm = document.querySelector("#submit-form");
const $messageInput = $messageForm.querySelector("input");
const $messageButton = $messageForm.querySelector("button");
const $sendLocation = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  const $newmesage = $messages.lastElementChild;
  const newMessagestyles = getComputedStyle($newmesage);
  const newmessageMargin = parseInt(newMessagestyles.marginBottom);
  const newMessageHeight = $newmesage.offsetHeight + newmessageMargin;
  const visibleHeight = $messages.offsetHeight;
  const containerHeight = $messages.scrollHeight;
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = containerHeight;
  }
};

socket.on("onMessage", (wellcome) => {
  const html = Mustache.render(messageTemplate, {
    username: wellcome.username,
    message: wellcome.text,
    createdAt: moment(wellcome.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});
socket.on("locationMessage", (location) => {
  const html = Mustache.render(locationTemplate, {
    username: location.username,
    location: location.url,
    createdAt: moment(location.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

let mesageInput;

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageButton.setAttribute("disabled", "disabled");
  mesageInput = e.target.elements.messageInput.value;

  socket.emit("sendMessage", mesageInput, (error) => {
    $messageButton.removeAttribute("disabled");
    $messageInput.value = "";
    $messageInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log("Delivered");
  });
});

$sendLocation.addEventListener("click", () => {
  $sendLocation.setAttribute("disabled", "disabled");
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }
  navigator.geolocation.getCurrentPosition((position) => {
    const { longitude, latitude } = position.coords;

    socket.emit("sendLocation", { longitude, latitude }, () => {
      $sendLocation.removeAttribute("disabled");
      console.log("Location shared");
    });
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert("User alredy exist");
    location.href = "/";
  }
});
