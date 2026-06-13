import logging

from sqlalchemy.orm import Session

from app.auth import get_password_hash
from app.config import settings
from app.db import SessionLocal
from app.models.category import Category
from app.models.category_rule import CategoryRule
from app.models.user import User

logger = logging.getLogger(__name__)


def init_database():
    """Initialize database with admin user and default categories"""
    db: Session = SessionLocal()

    try:
        # Create admin user if not exists
        existing_user = db.query(User).filter(User.username == settings.ADMIN_USER).first()
        if not existing_user:
            logger.info(f"Creating admin user: {settings.ADMIN_USER}")
            admin_user = User(
                username=settings.ADMIN_USER,
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            )
            db.add(admin_user)
            db.commit()
            logger.info("Admin user created successfully")
        else:
            logger.info("Admin user already exists")

        # Create default categories if none exist
        existing_categories = db.query(Category).count()
        if existing_categories == 0:
            logger.info("Creating default categories...")
            default_categories = [
                {"name": "Groceries", "icon": "🛒", "color": "#4CAF50"},
                {"name": "Restaurants", "icon": "🍽️", "color": "#FF9800"},
                {"name": "Transport", "icon": "🚗", "color": "#2196F3"},
                {"name": "Entertainment", "icon": "🎬", "color": "#9C27B0"},
                {"name": "Shopping", "icon": "🛍️", "color": "#E91E63"},
                {"name": "Health", "icon": "⚕️", "color": "#009688"},
                {"name": "Utilities", "icon": "⚡", "color": "#795548"},
                {"name": "Housing", "icon": "🏠", "color": "#607D8B"},
                {"name": "Income", "icon": "💰", "color": "#8BC34A"},
                {"name": "Subscriptions", "icon": "📱", "color": "#FF5722"},
                {"name": "Other", "icon": "📦", "color": "#9E9E9E"},
            ]

            category_map = {}
            for cat_data in default_categories:
                category = Category(**cat_data)
                db.add(category)
                db.flush()
                category_map[cat_data["name"]] = category.id

            db.commit()
            logger.info(f"Created {len(default_categories)} default categories")

            # Create default categorization rules for common German merchants
            logger.info("Creating default categorization rules...")
            default_rules = [
                # Groceries
                {"pattern": "REWE", "category_name": "Groceries", "match_type": "contains"},
                {"pattern": "EDEKA", "category_name": "Groceries", "match_type": "contains"},
                {"pattern": "ALDI", "category_name": "Groceries", "match_type": "contains"},
                {"pattern": "LIDL", "category_name": "Groceries", "match_type": "contains"},
                {"pattern": "PENNY", "category_name": "Groceries", "match_type": "contains"},
                {"pattern": "NETTO", "category_name": "Groceries", "match_type": "contains"},
                # Restaurants
                {"pattern": "RESTAURANT", "category_name": "Restaurants", "match_type": "contains"},
                {"pattern": "CAFE", "category_name": "Restaurants", "match_type": "contains"},
                {"pattern": "LIEFERANDO", "category_name": "Restaurants", "match_type": "contains"},
                # Transport
                {"pattern": "DEUTSCHE BAHN", "category_name": "Transport", "match_type": "contains"},
                {"pattern": "SHELL", "category_name": "Transport", "match_type": "contains"},
                {"pattern": "ARAL", "category_name": "Transport", "match_type": "contains"},
                # Shopping
                {"pattern": "AMAZON", "category_name": "Shopping", "match_type": "contains"},
                {"pattern": "ZALANDO", "category_name": "Shopping", "match_type": "contains"},
                # Subscriptions
                {"pattern": "SPOTIFY", "category_name": "Subscriptions", "match_type": "contains"},
                {"pattern": "NETFLIX", "category_name": "Subscriptions", "match_type": "contains"},
                {"pattern": "DISNEY+", "category_name": "Subscriptions", "match_type": "contains"},
            ]

            for rule_data in default_rules:
                category_name = rule_data.pop("category_name")
                if category_name in category_map:
                    rule = CategoryRule(
                        pattern=rule_data["pattern"],
                        category_id=category_map[category_name],
                        match_type=rule_data["match_type"],
                    )
                    db.add(rule)

            db.commit()
            logger.info(f"Created {len(default_rules)} default categorization rules")
        else:
            logger.info(f"Database already has {existing_categories} categories")

    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        db.rollback()
        raise
    finally:
        db.close()
