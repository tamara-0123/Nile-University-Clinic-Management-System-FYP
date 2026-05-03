const schemaMap = {
  "clinic.appointments": {
    bsonType: "object",
    properties: {
      reason: {
        encrypt: {
          bsonType: "string",
          algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
          keyId: [dataKeyId]
        }
      },
      condition: {
        encrypt: {
          bsonType: "string",
          algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
          keyId: [dataKeyId]
        }
      },
      clinicalNotes: {
        encrypt: {
          bsonType: "string",
          algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
          keyId: [dataKeyId]
        }
      }
    }
  },

  "clinic.patients": {
    bsonType: "object",
    properties: {
      allergies: {
        encrypt: {
          bsonType: "array",
          algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
          keyId: [dataKeyId]
        }
      },
      chronicConditions: {
        encrypt: {
          bsonType: "array",
          algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
          keyId: [dataKeyId]
        }
      },
      emergencyContact: {
        bsonType: "object",
        properties: {
          name: {
            encrypt: {
              bsonType: "string",
              algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
              keyId: [dataKeyId]
            }
          },
          phone: {
            encrypt: {
              bsonType: "string",
              algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
              keyId: [dataKeyId]
            }
          }
        }
      }
    }
  }
};