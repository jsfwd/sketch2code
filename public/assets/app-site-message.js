// hide the preview message tht displays when the preview loads
//document.getElementById('site-message').onclick = function() {
document.body.onclick = function() {
	//document.getElementById('note-preview').style.display = 'none';
	//document.getElementById('note-preview').addClass('is-hidden');
    //this.classList.add('is-hidden');
    document.body.className = document.body.className.replace('site-message-visible', '');
}