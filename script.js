function sendMail(event){
    event.preventDefault();
    let params = {
        user_email : document.getElementById("user_email").value,
        subject : document.getElementById("subject").value,
        message : document.getElementById("message").value,
    }
    const msg = document.getElementById("msg");
    const form = document.getElementById("contact_form");
    /* Email Services ID, Template ID, Parameters*/
    emailjs.send("service_bi067ki", "template_pgnmbfl", params).then(() => {
        alert("Email Sent ✅");
        msg.textContent = "Thank you ❤️";
        form.reset();
        setTimeout(() => {msg.textContent = "✉️";}, 10000);
    });
}