# AI-Integrated Methane Monitoring for Ethiopia's Ruminant Livestock

Password-protected web presentation of the concept note *AI-Integrated Methane Emission Monitoring for Ethiopia's
Ruminant Livestock Sector* (zero draft, for discussion) by Dr. Shigdaf Mekuriaw, with suggested strengthening points.

**Web page:** <https://setegnworku.github.io/ethiopia-ai-methane-monitoring/> (password shared separately)

The published `index.html` is encrypted (AES-256-GCM, key derived from the password with PBKDF2-SHA256) and is
decrypted in the browser after the password is entered. To update the page, edit the private source and rebuild:

```bash
PAGE_PASSWORD=... node build_encrypted.js
```
