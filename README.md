zigbee2mqtt external converter for samsung sds door lock


Z2M 에서 삼성도어락 사용을 위한 외부 컨버터 입니다.
아래 참고자료의 여러 소스들을 참고 하여 만들었습니다.

​
1. 기능: 문열기
2. 상태: 
 - lock State: 문 열기/닫기 상태
 - operated By: 문 열린 경우 열린 방법
     Key, Inside Handle, Auto, Zigbee, Manual, Bluetooth, RFID Tag, Fingerprint, Lock Code
 - Id: 지문 RFID 로 열린경우 - 지문, RFID 등록 순번 
   ex> F-1, R-2

​
참고자료
sds 도어락
https://5mango.com/samsung-sds-shp-dp960-z2m/

st edge 드라이버
https://github.com/SmartThingsCommunity/SmartThingsEdgeDrivers/tree/main/drivers/SmartThings/zigbee-lock
