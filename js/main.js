document.addEventListener('DOMContentLoaded', () => {

    /**
     * 1. Funcionalidad de Navbar con Scroll
     * Añade/quita la clase '.scrolled' al header cuando el usuario hace scroll.
     * La comprobación `if (header)` asegura que no haya error si el header
     * aún no se ha cargado.
     */
    window.addEventListener('scroll', () => {
        // El header puede no existir inmediatamente, así que lo seleccionamos aquí.
        const header = document.querySelector('.main-header'); 
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });

    /**
     * 2. Lógica del Menú Móvil (Hamburger)
     * Se utiliza delegación de eventos en el 'body' para que el listener
     * funcione incluso con el header cargado dinámicamente.
     */
    document.body.addEventListener('click', function(event) {
        // Busca si el clic fue en el botón hamburguesa o un elemento dentro de él.
        const hamburgerBtn = event.target.closest('.hamburger-menu');
        const nav = document.querySelector('.main-nav');

        if (hamburgerBtn && nav) {
            // Alterna la clase 'active' para mostrar/ocultar el menú.
            nav.classList.toggle('active');
            hamburgerBtn.classList.toggle('active'); // Opcional, para animar el icono
        }

        // Cierra el menú si se hace clic en un enlace dentro de él (en móvil)
        if (nav && nav.classList.contains('active')) {
            const linkClicked = event.target.closest('a');
            if (linkClicked && nav.contains(linkClicked)) {
                nav.classList.remove('active');
                document.querySelector('.hamburger-menu').classList.remove('active');
            }
        }
    });

});