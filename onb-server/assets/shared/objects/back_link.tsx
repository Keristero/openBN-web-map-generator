<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.5" tiledversion="1.5.0" name="link" tilewidth="61" tileheight="32" tilecount="6" columns="6" objectalignment="top">
 <tileoffset x="1" y="0"/>
 <image source="back_link.png" width="366" height="32"/>
 <tile id="0">
  <objectgroup draworder="index" id="2">
   <object id="1" x="30.5" y="0">
    <polygon points="0,0 -30.5,16 0,32 30.5,16"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="1">
  <animation>
   <frame tileid="1" duration="100"/>
   <frame tileid="2" duration="100"/>
   <frame tileid="3" duration="100"/>
   <frame tileid="4" duration="100"/>
   <frame tileid="5" duration="100"/>
  </animation>
 </tile>
</tileset>
