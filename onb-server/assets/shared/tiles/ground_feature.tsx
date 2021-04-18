<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.5" tiledversion="1.5.0" name="ground_feature" tilewidth="64" tileheight="32" tilecount="4" columns="4" objectalignment="top">
 <properties>
  <property name="Type" value="ground_feature"/>
 </properties>
 <image source="ground_feature.png" width="256" height="32"/>
 <tile id="0">
  <properties>
   <property name="Direction" value="Up Left"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="2" x="16" y="16">
    <polygon points="0,0 16,8 32,0 16,-8 0,0"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="1">
  <properties>
   <property name="Direction" value="Up Right"/>
  </properties>
 </tile>
 <tile id="2">
  <properties>
   <property name="Direction" value="Down Right"/>
  </properties>
 </tile>
 <tile id="3">
  <properties>
   <property name="Direction" value="Down Left"/>
  </properties>
 </tile>
</tileset>
