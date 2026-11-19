(() => {
  const preview = document.querySelector('figure img');
  const walk = document.querySelector('.walk');
  const label = document.querySelector('#walk-label');
  const rooms = {
    living: [preview.getAttribute('src'), preview.alt],
    main: ['radiant/assets/room-details/main.webp?v=unity1', '主卧模型渲染，展示包布床头、分层靠枕与垂落的床尾毯'],
    kitchen: ['radiant/assets/room-details/kitchen.webp?v=opt3', '厨房模型渲染，展示Unionville 竖纹吊柜、通高挡板和嵌入式冰箱'],
    bath: ['radiant/assets/room-details/bath.webp?v=unity1', '公卫模型渲染，展示白釉坐便器、缓降座盖与浴室柜']
  };
  const buttons = document.querySelectorAll('.room-picker button');
  for (const button of buttons) {
    button.onclick = () => {
      const room = button.dataset.room;
      const [src, alt] = rooms[room];
      preview.src = src;
      preview.alt = alt;
      label.textContent = '走进' + button.textContent;
      walk.href = 'radiant/?room=' + room + '&view=walk';
      for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));
    };
  }
})();
