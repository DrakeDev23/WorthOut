import os
import uuid

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.models import User, WorkoutRoutine
from app.services.ownership import OwnershipViolation, require_owned_routine

TEST_DATABASE_URL = os.getenv('TEST_DATABASE_URL')


@pytest.mark.asyncio
async def test_cross_user_routine_reference_is_rejected_by_ownership_guard() -> None:
    if not TEST_DATABASE_URL:
        pytest.skip('TEST_DATABASE_URL is required for the live PostgreSQL ownership test')

    engine = create_async_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    user_a = uuid.uuid4()
    user_b = uuid.uuid4()
    routine_id = uuid.uuid4()
    async with session_factory() as session:
        async with session.begin():
            session.add_all(
                [
                    User(id=user_a, clerk_user_id=f'test-a-{user_a}'),
                    User(id=user_b, clerk_user_id=f'test-b-{user_b}'),
                    WorkoutRoutine(id=routine_id, user_id=user_a, name='Private routine'),
                ]
            )
        with pytest.raises(OwnershipViolation):
            await require_owned_routine(session, user_id=user_b, routine_id=routine_id)
        await session.rollback()
    await engine.dispose()
