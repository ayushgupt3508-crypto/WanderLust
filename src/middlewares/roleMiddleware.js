const verifyRole = async (req,res,next) => {
    if(req.user?.role !== "admin"){
        return res.status(403)
        .json("User is not authorized for this task!!!")
    }

    next()
}

export {verifyRole}