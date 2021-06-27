
$(document).ready(function(){
    $(window).scroll(function(){
        var scroll = $(window).scrollTop();
        if (scroll > 100) {
          $(".navbar-fixed-top").addClass("scrolled");
          $(".logo").addClass("logo-slide");
          $(".navigation__user-signup").addClass("navigation__user-signup-slide");
          $(".navigation__shop-icon").addClass("navigation__shop-icon-slide");
          $(".menu__icon").addClass("menu__icon-slide");
          $(".nav-menu__button").addClass("nav-menu__button-slide");
        }
  
        // else{
        //     $(".navbar-fixed-top").css("background" , "#333");  	
        // }
    })
})

$(document).ready(function(){
  $(window).scroll(function(){
      var scroll = $(window).scrollTop();
      if (scroll > 500) {
        $(".sidebar").addClass("sidebar-not-hidden");
      }
  })
})


let count = 0;

 $(".shop__btn").click(function(event) {
   console.log(event.target.id);
   count++;
   
 });


 var stripe = Stripe("pk_test_TYooMQauvdEDq54NiTphI7jx");
    var checkoutButton = document.getElementById("checkout-button");

    checkoutButton.addEventListener("click", function () {
      fetch("/create-checkout-session", {
        method: "POST",
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (session) {
          return stripe.redirectToCheckout({ sessionId: session.id });
        })
        .then(function (result) {
          // If redirectToCheckout fails due to a browser or network
          // error, you should display the localized error message to your
          // customer using error.message.
          if (result.error) {
            alert(result.error.message);
          }
        })
        .catch(function (error) {
          console.error("Error:", error);
        });
    });

let total = 0;    
let totalPrice = document.querySelector(".cart__total-price");

let itemsPrice = document.querySelectorAll(".cart__items-price");

itemsPrice.forEach(itemPrice => {
  total += parseInt(itemPrice.innerHTML);
})

totalPrice.innerHTML = "Rs." + total;






 