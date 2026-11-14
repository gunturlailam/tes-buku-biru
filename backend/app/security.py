import hashlib, hmac, secrets
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, Request
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
    if sess.expires_at:
        # Normalize: SQLite stores naive datetimes, PostgreSQL stores with tz
        exp = sess.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            raise HTTPException(401, "Token sudah kedaluwarsa, silakan login ulang")
    return db.get(models.User, sess.user_id)

def get_current_org(request: Request, user=Depends(get_current_user), db=Depends(get_db)):
    org_id_header = request.headers.get("X-Organization-ID")
    if org_id_header:
        try:
            requested_org_id = int(org_id_header)
        except ValueError:
            raise HTTPException(400, "X-Organization-ID tidak valid")
        m = db.query(models.Membership).filter_by(
            user_id=user.id, organization_id=requested_org_id
        ).first()
        if not m:
            raise HTTPException(403, "Anda bukan anggota organisasi tersebut")
        return requested_org_id
    # Fallback: ambil org pertama (untuk backward compatibility)
    m = (db.query(models.Membership).filter_by(user_id=user.id)
         .order_by(models.Membership.organization_id).first())
    if m is None:
        raise HTTPException(403, "User tidak memiliki organisasi")
    return m.organization_id
