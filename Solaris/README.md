# Solaris

Extraia o ZIP inteiro e abra `index.html` no navegador. Para editar, use **Arquivo → Abrir Pasta** no VS Code e selecione a pasta que contém esse arquivo. Com Chrome ou Edge instalado, escolha o navegador em **Executar e Depurar** e pressione **F5**.

O jogo usa JavaScript e Canvas 2D. Pode rodar localmente, sem instalar pacotes ou iniciar um servidor.

- `js/avatar/` reúne o guarda-roupa, as cores, os acessórios e a animação.
- `assets/avatar/atlas.js` contém as grades de pixels, paletas e máscaras de cor.
- `js/interface/` controla o criador e a introdução.
- `js/jogo/` contém a campanha, a simulação, o desenho das fases e os controles.
- `css/` define a aparência dos menus. As imagens ficam em `assets/`.

O progresso fica no armazenamento local do navegador. A abertura por arquivo e a abertura por servidor local podem usar áreas de salvamento diferentes.

As peças ilustradas e o elenco estão em `assets/atelier/`. As versões compactas usadas pelo jogo ficam em `assets/avatar/atelier.js`. O guia e os desafios de campanha ficam em `js/jogo/guia.js` e `js/jogo/travessia.js`.
