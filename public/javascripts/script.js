// toggle edit/cancel button
const editButton = document.querySelectorAll(".toggle-edit-form");
// toggle review form
const reviewForm = document.querySelector(".edit-review-form");

editButton.forEach(function(edit) {
    edit.addEventListener("click", function() {
        if(edit.innerText === "Edit") {
            edit.innerText = "Cancel";
            edit.nextElementSibling.style.display = "block";
        } else {
            edit.innerText = "Edit";
            reviewForm.style.display = "none";
            edit.nextElementSibling.style.display = "none";
        }
    })
});    
