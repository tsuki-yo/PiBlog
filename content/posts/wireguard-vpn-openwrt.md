+++
title = 'Why I Run WireGuard on My OpenWrt Router (And How You Can Too)'
date = 2026-01-16T16:00:00+09:00
draft = true
tags = ['homelab', 'openwrt', 'wireguard', 'vpn', 'networking', 'self-hosting']
description = "Set up WireGuard VPN on your OpenWrt router for secure remote access to your homelab. Access all your services from anywhere without exposing them to the internet."
cover_image = "/images/wireguard-cover.png"
+++

## TL;DR

Running WireGuard on your OpenWrt router lets you access your entire homelab from anywhere - your phone, laptop, or any device. No need to expose individual services to the internet. Connect to VPN, and you're on your home network.

This post walks through setting up WireGuard on OpenWrt using UCI, configuring the firewall, and adding client devices.

> 📦 This WireGuard setup runs on my DeskPi 12U homelab in a 10sqm Tokyo apartment. See the full setup: [Small But Mighty Homelab: DeskPi 12U Running 20+ Services](https://dev.to/tsukiyo/small-but-mighty-homelab-deskpi-12u-running-20-services-4l7f).

**Contents:**
1. [Why WireGuard on Your Router?](#1-why-wireguard-on-your-router)
2. [What is WireGuard?](#2-what-is-wireguard)
3. [Prerequisites](#3-prerequisites)
4. [Installing WireGuard](#4-installing-wireguard)
5. [Creating the Server Interface](#5-creating-the-server-interface)
6. [Firewall Configuration](#6-firewall-configuration)
7. [Adding Client Peers](#7-adding-client-peers)
8. [Client Configuration](#8-client-configuration)
9. [Testing the Connection](#9-testing-the-connection)
10. [Tips and Troubleshooting](#10-tips-and-troubleshooting)

## 1. Why WireGuard on Your Router?

You have services running in your homelab - Grafana, Home Assistant, Jellyfin, Bitwarden. They're accessible via clean subdomain URLs on your local network. But what about when you're away from home?

Options for remote access:

1. **Port forwarding each service** - Expose Grafana, Home Assistant, Jellyfin directly to the internet. Multiple attack surfaces, each service needs to be secured individually.
2. **Cloudflare Tunnel** - Works, but routes traffic through third party.
3. **VPN** - Forward one port, get encrypted access to everything.

VPN still uses port forwarding, but you're exposing a single encrypted endpoint instead of dozens of services. One port to secure, one protocol to audit. VPN also requires routing - the router needs to route traffic between VPN clients and your LAN. Running it on your router means:

- **Always on** - Router runs 24/7 anyway
- **No extra hardware** - No separate VPN server needed
- **Full network access** - Not just one service, your entire LAN
- **Single entry point** - One port to secure, not dozens

## 2. What is WireGuard?

WireGuard is a modern VPN protocol. Compared to OpenVPN or IPsec:

| Feature | WireGuard | OpenVPN |
|---------|-----------|---------|
| Code lines | ~4,000 | ~100,000 |
| Speed | Faster | Slower |
| Setup | Simple | Complex |
| Cryptography | Modern (ChaCha20, Curve25519) | Configurable (can be outdated) |
| Roaming | Seamless | Reconnects needed |

WireGuard uses public/private key cryptography:

- **Private key** - Secret, stays on your device. Never share this.
- **Public key** - Derived from private key, safe to share. Give this to peers.

Each device generates a key pair. You exchange public keys with peers you want to connect to. The magic: data encrypted with a public key can only be decrypted by the matching private key. So you can send your public key openly - only you can decrypt messages meant for you.

{{< mermaid class="text-center" style="max-width: 800px; margin: 0 auto;" >}}
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'nodeTextColor': '#000', 'textColor': '#000', 'nodeBorder': '#333', 'mainBkg': '#fff'}}}%%
flowchart LR
    subgraph router["Router"]
        R_Priv["Private Key 🔒"]
        R_Pub["Public Key 🔓"]
    end
    subgraph phone["Phone"]
        P_Priv["Private Key 🔒"]
        P_Pub["Public Key 🔓"]
    end

    R_Pub -->|"Share"| phone
    P_Pub -->|"Share"| router
{{< /mermaid >}}

Once keys are exchanged, clients can connect from anywhere and access your home network through an encrypted tunnel:

{{< mermaid class="text-center" style="max-width: 800px; margin: 0 auto;" >}}
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'nodeTextColor': '#000', 'textColor': '#000', 'nodeBorder': '#333', 'mainBkg': '#fff'}}}%%
flowchart LR
    subgraph home["Home Network"]
        Router["OpenWrt Router<br/>WireGuard Server<br/>10.0.10.1"]
        Services["Homelab Services<br/>192.168.1.x"]
    end
    subgraph remote["Remote"]
        Phone["Phone<br/>10.0.10.2"]
        Laptop["Laptop<br/>10.0.10.3"]
    end

    Phone -->|Encrypted Tunnel| Router
    Laptop -->|Encrypted Tunnel| Router
    Router --> Services
{{< /mermaid >}}

## 3. Prerequisites

Before starting:

- OpenWrt router with sufficient RAM (256MB+)
- SSH access to your router
- A static public IP or dynamic DNS (for remote connections)
- Port forwarding capability from your ISP

Check the [OpenWrt Table of Hardware](https://openwrt.org/toh/start) if you're unsure about your router.

## 4. Installing WireGuard

SSH into your router and install WireGuard:

```bash
opkg update
opkg install wireguard-tools luci-proto-wireguard
```

The `luci-proto-wireguard` package adds WireGuard support to the LuCI web interface, but we'll configure via UCI for reproducibility.

## 5. Creating the Server Interface

In OpenWrt, a network interface is a logical connection point - like `lan` for your local network or `wan` for internet. We'll create a new interface called `wg0` for WireGuard. This interface will have its own IP address (10.0.10.1) and act as the VPN endpoint.

Setting up the server requires two steps: generating a key pair, then creating the interface with that key.

### Generate Server Keys

First, create the router's key pair. The private key stays on the router; you'll share the public key with clients later.

```bash
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
chmod 600 /etc/wireguard/server_private.key
```

### Create the Interface

```bash
# Set up the WireGuard interface
uci set network.wg0=interface
uci set network.wg0.proto='wireguard'
uci set network.wg0.private_key="$(cat /etc/wireguard/server_private.key)"
uci set network.wg0.listen_port='51820'
uci add_list network.wg0.addresses='10.0.10.1/24'

uci commit network
/etc/init.d/network reload
```

Key settings:
- `proto='wireguard'` - Use WireGuard protocol
- `listen_port` - UDP port for incoming connections (default 51820)
- `addresses` - VPN subnet. The server is 10.0.10.1, clients get 10.0.10.2, 10.0.10.3, etc.

## 6. Firewall Configuration

The interface is ready, but clients can't connect yet. OpenWrt's firewall uses **zones** to group interfaces and control traffic between them. By default you have `lan` (trusted) and `wan` (untrusted). WireGuard needs its own zone so we can define what VPN clients are allowed to access.

### 1. Create a Firewall Zone

Why: VPN clients need a zone so we can control their access. Without this, traffic from VPN clients would be dropped.

```bash
# Create zone for WireGuard traffic
uci add firewall zone
uci set firewall.@zone[-1].name='wg'
uci set firewall.@zone[-1].input='ACCEPT'
uci set firewall.@zone[-1].output='ACCEPT'
uci set firewall.@zone[-1].forward='ACCEPT'
uci set firewall.@zone[-1].masq='1'
uci set firewall.@zone[-1].mtu_fix='1'
uci add_list firewall.@zone[-1].network='wg0'
```

- `masq='1'` - Enables masquerading (NAT). Makes VPN client traffic appear to come from the router, so LAN devices can respond.
- `mtu_fix='1'` - Fixes packet size issues that can occur with VPN tunnels.

### 2. Allow Forwarding to LAN

Why: By default, zones don't talk to each other. We need explicit rules saying "traffic from wg zone can go to lan zone."

```bash
# Allow WireGuard clients to access LAN
uci add firewall forwarding
uci set firewall.@forwarding[-1].src='wg'
uci set firewall.@forwarding[-1].dest='lan'

# Allow WireGuard clients to access internet through router
uci add firewall forwarding
uci set firewall.@forwarding[-1].src='wg'
uci set firewall.@forwarding[-1].dest='wan'
```

First rule: VPN clients can reach your homelab (192.168.1.x).
Second rule: VPN clients can access internet through your home connection (for full tunnel mode).

### 3. Allow Incoming WireGuard Connections

Why: The WAN zone blocks all incoming traffic by default. We need to punch a hole for WireGuard's UDP port.

```bash
# Open WireGuard port on WAN
uci add firewall rule
uci set firewall.@rule[-1].name='Allow-WireGuard'
uci set firewall.@rule[-1].src='wan'
uci set firewall.@rule[-1].dest_port='51820'
uci set firewall.@rule[-1].proto='udp'
uci set firewall.@rule[-1].target='ACCEPT'

uci commit firewall
/etc/init.d/firewall reload
```

## 7. Adding Client Peers

The server is listening and the firewall is open. Now we need to tell the server about each device that will connect.

### Generate Client Keys (on the client or router)

```bash
wg genkey | tee client_private.key | wg pubkey > client_public.key
```

### Add Peer to Server

```bash
uci add network wireguard_wg0
uci set network.@wireguard_wg0[-1].description='My Phone'
uci set network.@wireguard_wg0[-1].public_key='CLIENT_PUBLIC_KEY_HERE'
uci set network.@wireguard_wg0[-1].allowed_ips='10.0.10.2/32'

uci commit network
/etc/init.d/network reload
```

Each client gets:
- A unique `public_key` (generated on the client)
- A unique IP in `allowed_ips` (10.0.10.2, 10.0.10.3, etc.)

### Understanding allowed_ips

`allowed_ips` is the most confusing part of WireGuard because it does two things depending on which side you're on:

**On the server** (when adding a peer):
- Acts as a **source filter** - only accept packets from this peer if they come from these IPs
- `allowed_ips='10.0.10.2/32'` means "this peer can only send packets with source IP 10.0.10.2"

**On the client** (in the config file):
- Acts as a **routing table** - send packets to this peer if they're destined for these IPs
- `AllowedIPs = 192.168.1.0/24` means "route any traffic to 192.168.1.x through this VPN tunnel"

Think of it as:
- Server side: "What IPs is this peer allowed to claim?"
- Client side: "What IPs should I reach through this peer?"

**Example flow:**

{{< mermaid class="text-center" style="max-width: 900px; margin: 0 auto;" >}}
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'nodeTextColor': '#000', 'textColor': '#000', 'nodeBorder': '#333', 'mainBkg': '#fff'}}}%%
flowchart LR
    subgraph remote["Remote"]
        Phone["Phone<br/>10.0.10.2"]
    end
    subgraph home["Home Network"]
        Router["Router<br/>WireGuard"]
        Grafana["Grafana<br/>192.168.1.201"]
    end

    Phone -->|"1. AllowedIPs matches<br/>encrypt & send"| Router
    Router -->|"2. allowed_ips ✓<br/>route to LAN"| Grafana
    Grafana -->|"3. Response"| Router
    Router -->|"4. Encrypt & return"| Phone
{{< /mermaid >}}

## 8. Client Configuration

With the server configured and peer added, now set up the client. Install the WireGuard app on your phone or laptop and create a configuration:

```ini
[Interface]
PrivateKey = CLIENT_PRIVATE_KEY_HERE
Address = 10.0.10.2/32
DNS = 192.168.1.1

[Peer]
PublicKey = SERVER_PUBLIC_KEY_HERE
Endpoint = your-public-ip:51820
AllowedIPs = 192.168.1.0/24, 10.0.10.0/24
PersistentKeepalive = 25
```

Key settings:
- `Address` - The client's VPN IP (must match server's allowed_ips for this peer)
- `DNS` - Use your router for DNS to resolve local hostnames
- `Endpoint` - Your home's public IP and WireGuard port
- `AllowedIPs` - Routes to send through this tunnel (remember, on the client side this is a routing table - see Chapter 7)
- `PersistentKeepalive` - Keeps connection alive behind NAT

### Full Tunnel vs Split Tunnel

The `AllowedIPs` setting determines what traffic goes through the VPN:

{{< mermaid class="text-center" style="max-width: 900px; margin: 0 auto;" >}}
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'nodeTextColor': '#000', 'textColor': '#000', 'nodeBorder': '#333', 'mainBkg': '#fff'}}}%%
flowchart LR
    subgraph split["Split Tunnel"]
        direction LR
        P1["Phone"] -->|"Homelab traffic"| H1["Home Router"]
        P1 -->|"Internet traffic"| I1["Direct to Internet"]
    end
    subgraph full["Full Tunnel"]
        direction LR
        P2["Phone"] -->|"All traffic"| H2["Home Router"]
        H2 -->|"Internet traffic"| I2["Internet"]
    end
{{< /mermaid >}}

**Split tunnel** (recommended for homelab access):
```ini
AllowedIPs = 192.168.1.0/24, 10.0.10.0/24
```
Only homelab traffic goes through VPN. Regular internet uses your current connection.

**Full tunnel** (all traffic through VPN):
```ini
AllowedIPs = 0.0.0.0/0
```
All traffic routes through your home internet. Useful for privacy on public WiFi.

## 9. Testing the Connection

Server configured, firewall open, client ready. Time to test.

### On the Router

Check WireGuard status:

```bash
wg show
```

You should see your interface and connected peers:

```
interface: wg0
  public key: YOUR_SERVER_PUBLIC_KEY
  listening port: 51820

peer: CLIENT_PUBLIC_KEY
  endpoint: client-ip:port
  allowed ips: 10.0.10.2/32
  latest handshake: X seconds ago
  transfer: X MiB received, X MiB sent
```

### From Client

1. Enable WireGuard on your phone/laptop
2. Try to ping the router: `ping 10.0.10.1`
3. Try to access a homelab service: `https://grafana.raspberrypi.home`

If DNS isn't resolving, use IP directly first: `http://192.168.1.201:3000`

## 10. Tips and Troubleshooting

If something isn't working, here are the common issues and solutions.

### Connection Issues

**Can't connect at all:**
- Check firewall rule allows UDP on your WireGuard port
- Verify your public IP hasn't changed
- Ensure port is forwarded if behind another router/modem

**Connects but can't reach LAN:**
- Check forwarding rules between wg and lan zones
- Verify masquerading is enabled on the wg zone
- Check allowed_ips on server includes the client IP

### Dynamic DNS

If you don't have a static IP, use a dynamic DNS service:

1. Set up DDNS on OpenWrt: `opkg install ddns-scripts luci-app-ddns`
2. Configure with your provider (DuckDNS, No-IP, etc.)
3. Use the DDNS hostname as your Endpoint

### Multiple Devices

Each device needs:
1. Its own key pair
2. A unique IP in the VPN subnet
3. A peer entry on the server

Example for three devices:
- Phone: 10.0.10.2/32
- Laptop: 10.0.10.3/32
- Tablet: 10.0.10.4/32

### Security Considerations

- **Keep private keys private** - Never share or commit them
- **Use strong random keys** - Always generate with `wg genkey`
- **Limit allowed_ips** - Only give clients access to what they need
- **Monitor connections** - Check `wg show` periodically for unknown peers

## What's Next

With WireGuard running, you can now:
- Access your homelab from anywhere
- Use local DNS names (grafana.raspberrypi.home) remotely
- Keep all your services off the public internet

Combined with [nginx reverse proxy](/posts/nginx-reverse-proxy-openwrt/), you have a complete secure access solution for your homelab.

## Conclusion

WireGuard on OpenWrt gives you secure remote access to your entire homelab with minimal setup. The router handles VPN connections alongside its normal routing duties - no extra hardware or services needed.

The combination of public/private keys makes adding new devices straightforward, and the lightweight protocol means minimal battery drain on mobile devices.

Set it up once, and your homelab is accessible from anywhere.

---

*I write weekly about homelabs, monitoring, and DevOps. If you found this helpful, check out my other posts or subscribe on [Dev.to](https://dev.to/tsukiyo) for more practical guides like this one.*
