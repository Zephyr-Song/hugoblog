/**
 * Music Loader - 强制创建音量按钮
 */
(function () {
  function initMeting() {
    var el = document.createElement('meting-js');
    el.setAttribute('server', 'netease');
    el.setAttribute('type', 'playlist');
    el.setAttribute('id', '2809513713');
    el.setAttribute('fixed', 'true');
    el.setAttribute('mini', 'false');
    el.setAttribute('list-folded', 'false');
    el.setAttribute('autoplay', 'false');
    el.setAttribute('theme', '#8fb3a9');
    document.body.appendChild(el);
    
    // 等待播放器创建后，强制添加音量按钮
    setTimeout(fixVolumeButton, 2000);
  }

  function fixVolumeButton() {
    var controller = document.querySelector('.aplayer-fixed .aplayer-controller');
    if (!controller) return;
    
    // 检查是否已有音量按钮
    var existing = controller.querySelector('.aplayer-icon-volume');
    if (existing) return;
    
    // 创建音量按钮
    var volumeBtn = document.createElement('span');
    volumeBtn.className = 'aplayer-icon aplayer-icon-volume';
    volumeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
    volumeBtn.style.cssText = 'position:absolute !important; bottom:10px !important; right:100px !important; width:20px !important; height:20px !important; cursor:pointer !important; display:inline-block !important; visibility:visible !important; opacity:1 !important;';
    
    controller.appendChild(volumeBtn);
    console.log('[music] Volume button added');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMeting);
  } else {
    initMeting();
  }
})();