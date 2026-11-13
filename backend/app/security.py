import hashlib, hmac, secrets
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from .db import get_db
from . import models

bearer = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000)
    return f"{salt}${dk.hex()}"

def verify_password(password: str, stored: str) -> bool:
    salt, hexhash = stored.split("$", 1)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000)
    return hmac.compare_digest(dk.hex(), hexhash)

def get_current_user(creds=Depends(bearer), db=Depends(get_db)):
    if creds is None:
        raise HTTPException(401, "Login required")
    sess = db.get(models.Session, creds.credentials)
    if sess is None:
        raise HTTPException(401, "Invalid token")
    return db.get(models.User, sess.user_id)

def get_current_org(user=Depends(get_current_user), db=Depends(get_db)):
    # org diambil dari keanggotaan user di server, BUKAN dari input client
    m = (db.query(models.Membership).filter_by(user_id=user.id)
         .order_by(models.Membership.organization_id).first())
    if m is None:
        raise HTTPException(403, "User has no organization")
    return m.organization_id