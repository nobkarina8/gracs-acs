# TR-069/CWMP Protocol Guide

## Overview

TR-069 (Technical Report 069) is a technical specification from the Broadband Forum that defines an application layer protocol for remote management of end-user devices. Also known as CWMP (CPE WAN Management Protocol), it enables ISPs to manage customer premises equipment (CPE) remotely.

## Protocol Architecture

### Communication Model

TR-069 uses a client-server model:
- **CPE (Client)**: Customer device initiating communication
- **ACS (Server)**: Auto Configuration Server managing devices

### Transport Protocol

- **Protocol**: HTTP/HTTPS
- **Content-Type**: text/xml (SOAP)
- **Port**: Typically 7547 for ACS
- **Authentication**: HTTP Basic Auth or Digest Auth

## SOAP/XML Structure

All TR-069 messages are encapsulated in SOAP envelopes:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope 
    xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:cwmp="urn:dslforum-org:cwmp-1-0">
    <soap:Header>
        <!-- Optional header elements -->
    </soap:Header>
    <soap:Body>
        <!-- CWMP RPC method -->
    </soap:Body>
</soap:Envelope>
```

## RPC Methods

### 1. Inform

**Direction**: CPE → ACS  
**Purpose**: Device notification and status report

**Event Codes**:
- `0 BOOTSTRAP` - First connection after factory reset
- `1 BOOT` - Device boot
- `2 PERIODIC` - Periodic inform
- `4 VALUE CHANGE` - Parameter value changed
- `6 CONNECTION REQUEST` - Triggered by ACS connection request

**Example**:
```xml
<cwmp:Inform>
    <DeviceId>
        <Manufacturer>Huawei</Manufacturer>
        <OUI>00259E</OUI>
        <ProductClass>HG8245H</ProductClass>
        <SerialNumber>48575443AB123456</SerialNumber>
    </DeviceId>
    <Event soap:arrayType="cwmp:EventStruct[1]">
        <EventStruct>
            <EventCode>1 BOOT</EventCode>
            <CommandKey></CommandKey>
        </EventStruct>
    </Event>
    <MaxEnvelopes>1</MaxEnvelopes>
    <CurrentTime>2024-02-04T02:00:00Z</CurrentTime>
    <RetryCount>0</RetryCount>
    <ParameterList>
        <!-- Device parameters -->
    </ParameterList>
</cwmp:Inform>
```

**ACS Response**:
```xml
<cwmp:InformResponse>
    <MaxEnvelopes>1</MaxEnvelopes>
</cwmp:InformResponse>
```

### 2. GetParameterValues

**Direction**: ACS → CPE  
**Purpose**: Retrieve device parameter values

**Request**:
```xml
<cwmp:GetParameterValues>
    <ParameterNames soap:arrayType="xsd:string[3]">
        <string>InternetGatewayDevice.DeviceInfo.SoftwareVersion</string>
        <string>InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.ExternalIPAddress</string>
        <string>InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID</string>
    </ParameterNames>
</cwmp:GetParameterValues>
```

**CPE Response**:
```xml
<cwmp:GetParameterValuesResponse>
    <ParameterList soap:arrayType="cwmp:ParameterValueStruct[3]">
        <ParameterValueStruct>
            <Name>InternetGatewayDevice.DeviceInfo.SoftwareVersion</Name>
            <Value xsi:type="xsd:string">V3R016C10S115</Value>
        </ParameterValueStruct>
        <ParameterValueStruct>
            <Name>InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.ExternalIPAddress</Name>
            <Value xsi:type="xsd:string">192.168.1.100</Value>
        </ParameterValueStruct>
        <ParameterValueStruct>
            <Name>InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID</Name>
            <Value xsi:type="xsd:string">MyWiFiNetwork</Value>
        </ParameterValueStruct>
    </ParameterList>
</cwmp:GetParameterValuesResponse>
```

### 3. SetParameterValues

**Direction**: ACS → CPE  
**Purpose**: Configure device parameters

**Request**:
```xml
<cwmp:SetParameterValues>
    <ParameterList soap:arrayType="cwmp:ParameterValueStruct[2]">
        <ParameterValueStruct>
            <Name>InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID</Name>
            <Value xsi:type="xsd:string">NewWiFiSSID</Value>
        </ParameterValueStruct>
        <ParameterValueStruct>
            <Name>InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase</Name>
            <Value xsi:type="xsd:string">NewSecurePassword123</Value>
        </ParameterValueStruct>
    </ParameterList>
    <ParameterKey></ParameterKey>
</cwmp:SetParameterValues>
```

**CPE Response**:
```xml
<cwmp:SetParameterValuesResponse>
    <Status>0</Status>
</cwmp:SetParameterValuesResponse>
```

### 4. Download (Firmware Update)

**Direction**: ACS → CPE  
**Purpose**: Push firmware or configuration file

**Request**:
```xml
<cwmp:Download>
    <CommandKey>firmware_update_20240204</CommandKey>
    <FileType>1 Firmware Upgrade Image</FileType>
    <URL>http://firmware-server.com/firmware/v3.0.bin</URL>
    <Username></Username>
    <Password></Password>
    <FileSize>25600000</FileSize>
    <TargetFileName></TargetFileName>
    <DelaySeconds>0</DelaySeconds>
    <SuccessURL></SuccessURL>
    <FailureURL></FailureURL>
</cwmp:Download>
```

**CPE Response**:
```xml
<cwmp:DownloadResponse>
    <Status>1</Status>
    <StartTime>2024-02-04T02:05:00Z</StartTime>
    <CompleteTime>0001-01-01T00:00:00Z</CompleteTime>
</cwmp:DownloadResponse>
```

### 5. Reboot

**Direction**: ACS → CPE  
**Purpose**: Reboot device

**Request**:
```xml
<cwmp:Reboot>
    <CommandKey>reboot_20240204</CommandKey>
</cwmp:Reboot>
```

**CPE Response**:
```xml
<cwmp:RebootResponse></cwmp:RebootResponse>
```

### 6. TransferComplete

**Direction**: CPE → ACS  
**Purpose**: Notify ACS that download completed

**Request**:
```xml
<cwmp:TransferComplete>
    <CommandKey>firmware_update_20240204</CommandKey>
    <FaultStruct>
        <FaultCode>0</FaultCode>
        <FaultString></FaultString>
    </FaultStruct>
    <StartTime>2024-02-04T02:05:00Z</StartTime>
    <CompleteTime>2024-02-04T02:10:00Z</CompleteTime>
</cwmp:TransferComplete>
```

**ACS Response**:
```xml
<cwmp:TransferCompleteResponse></cwmp:TransferCompleteResponse>
```

## Common Device Parameters

### Device Information
```
InternetGatewayDevice.DeviceInfo.Manufacturer
InternetGatewayDevice.DeviceInfo.ManufacturerOUI
InternetGatewayDevice.DeviceInfo.ModelName
InternetGatewayDevice.DeviceInfo.SerialNumber
InternetGatewayDevice.DeviceInfo.HardwareVersion
InternetGatewayDevice.DeviceInfo.SoftwareVersion
InternetGatewayDevice.DeviceInfo.UpTime
```

### WiFi Configuration
```
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Enable
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Channel
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.BeaconType
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Standard
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase
```

### WAN Connection
```
InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Enable
InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Username
InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Password
InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.ExternalIPAddress
InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.ConnectionStatus
```

## Session Flow

1. **CPE Initiates Connection** 
   - CPE sends HTTP POST to ACS URL with Inform message
   - Includes device ID and event codes

2. **ACS Responds** 
   - ACS sends InformResponse
   - May include RPC method calls (Get/Set parameters, Download, etc.)

3. **CPE Executes** 
   - CPE processes RPC method
   - Sends response

4. **Session Continues** 
   - ACS may send additional RPC methods
   - Or sends empty SOAP body to end session

5. **Session Ends** 
   - CPE closes HTTP connection
   - Waits for next periodic inform interval

## Authentication

GRACS supports HTTP Basic Authentication for CPE devices:

```
Authorization: Basic base64(username:password)
```

Configure CPE credentials in ACS environment:
```env
CPE_DEFAULT_USERNAME=cpe_user
CPE_DEFAULT_PASSWORD=cpe_password
```

## Error Handling

### SOAP Faults

When errors occur, SOAP fault messages are returned:

```xml
<soap:Fault>
    <faultcode>Server</faultcode>
    <faultstring>Invalid parameter name</faultstring>
    <detail>
        <cwmp:Fault>
            <FaultCode>9005</FaultCode>
            <FaultString>Invalid parameter name</FaultString>
        </cwmp:Fault>
    </detail>
</soap:Fault>
```

### Common Fault Codes

- `9000` - Method not supported
- `9001` - Request denied
- `9002` - Internal error
- `9003` - Invalid arguments
- `9004` - Resources exceeded
- `9005` - Invalid parameter name
- `9006` - Invalid parameter type
- `9007` - Invalid parameter value
- `9008` - Attempt to set read-only parameter

## Best Practices

1. **Periodic Inform** - Configure appropriate interval (e.g., 300 seconds)
2. **Session Management** - Handle multiple RPC calls in single session
3. **Parameter Validation** - Validate all parameter values before applying
4. **Error Logging** - Log all SOAP faults and errors
5. **Security** - Use HTTPS in production environments
6. **Retry Logic** - Implement retry mechanism for failed tasks

## References

- [TR-069 Amendment 6](https://www.broadband-forum.org/technical/download/TR-069.pdf)
- [Broadband Forum](https://www.broadband-forum.org/)
- [CWMP Data Model](https://www.broadband-forum.org/cwmp)
